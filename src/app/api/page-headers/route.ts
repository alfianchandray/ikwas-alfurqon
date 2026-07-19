import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/ip";

// Helper: validate session
async function validateSession(req: NextRequest, db: any) {
  const token = req.cookies.get("ikwas_session")?.value;
  if (!token) return null;

  const session = await db
    .prepare(
      `SELECT s.user_id, u.username, p.role, p.name
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       JOIN pengurus p ON u.pengurus_id = p.id
       WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > datetime('now')`
    )
    .bind(token)
    .first() as any;

  return session || null;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (path) {
      const header = await db
        .prepare("SELECT * FROM page_headers WHERE path = ?")
        .bind(path)
        .first() as any;

      if (!header) {
        return NextResponse.json({ error: "Header halaman tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json(header);
    } else {
      const { results } = await db.prepare("SELECT * FROM page_headers ORDER BY path ASC").all();
      return NextResponse.json(results);
    }
  } catch (error: any) {
    console.error("GET page-headers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const session = await validateSession(req, db);
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Only allow Admin or Super Admin
    if (session.role !== "Super Admin" && !session.username.includes("admin")) {
      return NextResponse.json({ error: "Hak akses ditolak. Hanya Super Admin." }, { status: 403 });
    }

    const body = await req.json() as {
      path?: string;
      badge?: string;
      title?: string;
      description?: string;
    };
    const { path, badge, title, description } = body;

    if (!path || !title) {
      return NextResponse.json({ error: "Path dan Title wajib diisi." }, { status: 400 });
    }

    // Insert or update
    await db
      .prepare(
        `INSERT INTO page_headers (path, badge, title, description) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(path) DO UPDATE SET 
            badge = excluded.badge, 
            title = excluded.title, 
            description = excluded.description`
      )
      .bind(path, badge || "", title, description || "")
      .run();

    // Log Activity
    const ip = getClientIp(req);
    await db.prepare(
      "INSERT INTO activity_log (user_id, username, action, target_type, target_id, detail, ip_address, status) VALUES (?, ?, 'UPDATE_PAGE_HEADER', 'page_headers', ?, ?, ?, 'success')"
    ).bind(session.user_id, session.username, path, `Mengupdate header halaman ${path}`, ip).run();

    return NextResponse.json({ success: true, message: "Header halaman berhasil diperbarui." });
  } catch (error: any) {
    console.error("POST page-headers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

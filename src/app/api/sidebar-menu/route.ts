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
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM sidebar_menu ORDER BY sort_order ASC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET sidebar-menu error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const session = await validateSession(req, db);
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    if (session.role !== "Super Admin" && !session.username.includes("admin")) {
      return NextResponse.json({ error: "Hak akses ditolak." }, { status: 403 });
    }

    const body = await req.json() as { menuItems: { id: number; sort_order: number }[] };
    const { menuItems } = body;

    if (!Array.isArray(menuItems)) {
      return NextResponse.json({ error: "Format menuItems tidak valid." }, { status: 400 });
    }

    // Update sort_order for each item
    for (const item of menuItems) {
      await db
        .prepare("UPDATE sidebar_menu SET sort_order = ? WHERE id = ?")
        .bind(item.sort_order, item.id)
        .run();
    }

    // Log Activity
    const ip = getClientIp(req);
    await db.prepare(
      "INSERT INTO activity_log (user_id, username, action, target_type, target_id, detail, ip_address, status) VALUES (?, ?, 'REORDER_SIDEBAR', 'sidebar_menu', 'bulk', 'Menata ulang urutan menu navigasi sidebar', ?, 'success')"
    ).bind(session.user_id, session.username, ip).run();

    return NextResponse.json({ success: true, message: "Urutan navigasi sidebar berhasil disimpan." });
  } catch (error: any) {
    console.error("POST sidebar-menu error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

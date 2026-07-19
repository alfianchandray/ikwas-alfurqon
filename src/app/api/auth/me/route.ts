import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get("ikwas_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const session = await db
      .prepare(
        `SELECT s.id as session_id, s.expires_at, s.is_revoked,
                u.id as user_id, u.username, u.must_change_pw, u.last_login,
                p.name as pengurus_name, p.role, p.permissions
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         JOIN pengurus p ON u.pengurus_id = p.id
         WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > datetime('now')`
      )
      .bind(token)
      .first() as any;

    if (!session) {
      const response = NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
      response.cookies.set("ikwas_session", "", { httpOnly: true, path: "/", maxAge: 0 });
      return response;
    }

    return NextResponse.json({
      user: {
        id: session.user_id,
        username: session.username,
        name: session.pengurus_name,
        role: session.role,
        permissions: typeof session.permissions === "string" ? JSON.parse(session.permissions) : session.permissions,
        mustChangePw: session.must_change_pw === 1,
        lastLogin: session.last_login,
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

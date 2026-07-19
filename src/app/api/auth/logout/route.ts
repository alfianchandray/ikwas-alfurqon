import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get("ikwas_session")?.value;

    if (token) {
      // Get session for logging
      const session = await db
        .prepare("SELECT s.*, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.is_revoked = 0")
        .bind(token)
        .first() as any;

      if (session) {
        // Revoke session
        await db.prepare("UPDATE sessions SET is_revoked = 1 WHERE token = ?").bind(token).run();

        // Log logout
        const ip = getClientIp(req);
        await db.prepare(
          "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (?, ?, 'LOGOUT', 'auth', ?, ?, 'success')"
        ).bind(session.user_id, session.username, JSON.stringify({ session_id: session.id }), ip).run();
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("ikwas_session", "", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error: any) {
    console.error("POST /api/auth/logout error:", error);
    // Even if error, clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("ikwas_session", "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  }
}

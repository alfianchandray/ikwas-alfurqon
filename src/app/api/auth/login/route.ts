import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, generateSessionToken, computeExpiry } from "@/lib/crypto";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { username?: string; password?: string; rememberMe?: boolean };
    const { username, password, rememberMe = false } = body;

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan Password wajib diisi." }, { status: 400 });
    }

    // 1. Find user
    const user = await db
      .prepare("SELECT u.*, p.name as pengurus_name, p.role, p.permissions FROM users u JOIN pengurus p ON u.pengurus_id = p.id WHERE u.username = ? COLLATE NOCASE")
      .bind(username.trim())
      .first() as any;

    if (!user) {
      // Log failed attempt
      await db.prepare(
        "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (NULL, ?, 'LOGIN_FAILED', 'auth', ?, ?, 'failed')"
      ).bind(username, JSON.stringify({ reason: "user_not_found" }), ip).run();

      return NextResponse.json({ error: "Username atau Password salah." }, { status: 401 });
    }

    // 2. Check active
    if (!user.is_active) {
      return NextResponse.json({ error: "Akun Anda telah dinonaktifkan. Hubungi Super Admin." }, { status: 403 });
    }

    // 3. Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      // Log failed attempt
      await db.prepare(
        "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (?, ?, 'LOGIN_FAILED', 'auth', ?, ?, 'failed')"
      ).bind(user.id, user.username, JSON.stringify({ reason: "wrong_password" }), ip).run();

      return NextResponse.json({ error: "Username atau Password salah." }, { status: 401 });
    }

    // 4. Create session
    const token = generateSessionToken();
    const expiresAt = computeExpiry(rememberMe);

    await db.prepare(
      "INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(user.id, token, ip, userAgent, expiresAt).run();

    // 5. Update last_login
    await db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(user.id).run();

    // 6. Log success
    await db.prepare(
      "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (?, ?, 'LOGIN', 'auth', ?, ?, 'success')"
    ).bind(user.id, user.username, JSON.stringify({ rememberMe }), ip).run();

    // 7. Build response with HttpOnly cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.pengurus_name,
        role: user.role,
        permissions: typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions,
        mustChangePw: user.must_change_pw === 1,
      },
    });

    response.cookies.set("ikwas_session", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

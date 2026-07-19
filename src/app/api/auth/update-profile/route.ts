import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const token = req.cookies.get("ikwas_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // 1. Validate session
    const session = await db
      .prepare(
        `SELECT s.user_id, u.username, u.pengurus_id, p.name
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         JOIN pengurus p ON u.pengurus_id = p.id
         WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > datetime('now')`
      )
      .bind(token)
      .first() as any;

    if (!session) {
      return NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    const body = await req.json() as { name?: string; username?: string };
    const { name, username } = body;

    if (!name || !username) {
      return NextResponse.json({ error: "Nama dan Username wajib diisi." }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();

    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: "Username minimal 3 karakter." }, { status: 400 });
    }

    // 2. Check if username is already taken by another user
    const existingUser = await db
      .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
      .bind(trimmedUsername, session.user_id)
      .first() as any;

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan oleh orang lain." }, { status: 400 });
    }

    // 3. Begin transaction updates
    // Update pengurus (name)
    await db
      .prepare("UPDATE pengurus SET name = ? WHERE id = ?")
      .bind(trimmedName, session.pengurus_id)
      .run();

    // Update users (username)
    await db
      .prepare("UPDATE users SET username = ? WHERE id = ?")
      .bind(trimmedUsername, session.user_id)
      .run();

    // Log the profile update activity
    // 5. Log success
    const ip = getClientIp(req);
    await db
      .prepare(
        "INSERT INTO activity_log (user_id, username, action, target_type, target_id, detail, ip_address, status) VALUES (?, ?, 'UPDATE_PROFILE', 'users', ?, ?, ?, 'success')"
      )
      .bind(
        session.user_id,
        session.username,
        session.user_id.toString(),
        JSON.stringify({ old_name: session.name, new_name: trimmedName, old_username: session.username, new_username: trimmedUsername }),
        ip
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      user: {
        name: trimmedName,
        username: trimmedUsername,
      }
    });
  } catch (error: any) {
    console.error("POST /api/auth/update-profile error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

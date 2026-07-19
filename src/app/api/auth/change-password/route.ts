import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { getClientIp } from "@/lib/ip";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get("ikwas_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    // Validate session
    const session = await db
      .prepare("SELECT s.user_id, u.username, u.password_hash FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > datetime('now')")
      .bind(token)
      .first() as any;

    if (!session) {
      return NextResponse.json({ error: "Sesi telah berakhir. Silakan login kembali." }, { status: 401 });
    }

    const body = await req.json() as { oldPassword?: string; newPassword?: string; confirmPassword?: string };
    const { oldPassword, newPassword, confirmPassword } = body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Konfirmasi password tidak cocok." }, { status: 400 });
    }

    // Verify old password
    const isOldValid = await verifyPassword(oldPassword, session.password_hash);
    if (!isOldValid) {
      const ip = getClientIp(req);
      await db.prepare(
        "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (?, ?, 'CHANGE_PASSWORD', 'users', ?, ?, 'failed')"
      ).bind(session.user_id, session.username, JSON.stringify({ reason: "wrong_old_password" }), ip).run();

      return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 400 });
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password & clear must_change_pw flag
    await db.prepare(
      "UPDATE users SET password_hash = ?, must_change_pw = 0 WHERE id = ?"
    ).bind(newHash, session.user_id).run();

    // Revoke all other sessions (security: logout everywhere else)
    await db.prepare(
      "UPDATE sessions SET is_revoked = 1 WHERE user_id = ? AND token != ?"
    ).bind(session.user_id, token).run();

    // Log success
    const ip = getClientIp(req);
    await db.prepare(
      "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (?, ?, 'CHANGE_PASSWORD', 'users', ?, ?, 'success')"
    ).bind(session.user_id, session.username, JSON.stringify({ note: "password updated successfully" }), ip).run();

    return NextResponse.json({ success: true, message: "Password berhasil diperbarui. Sesi lain telah logout otomatis." });
  } catch (error: any) {
    console.error("POST /api/auth/change-password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

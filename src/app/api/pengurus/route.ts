import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

interface PengurusBody {
  name?: string;
  role?: string;
  username?: string;
  permissions?: Record<string, boolean> | string;
  id?: string | number;
  action?: string;
}

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare(
      "SELECT p.*, u.username, u.is_active FROM pengurus p LEFT JOIN users u ON u.pengurus_id = p.id ORDER BY p.id ASC"
    ).all();
    
    // Parse permissions JSON string
    const parsedResults = (results as any[]).map((r) => ({
      ...r,
      permissions: typeof r.permissions === "string" ? JSON.parse(r.permissions) : r.permissions
    }));

    return NextResponse.json(parsedResults);
  } catch (error: any) {
    console.error("GET pengurus error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as PengurusBody;
    const { name, role, username, permissions } = body;

    if (!name || !role || !username) {
      return NextResponse.json({ error: "Nama, Jabatan, dan Username wajib diisi!" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json({ error: "Username hanya boleh huruf kecil, angka, dan garis bawah (3-20 karakter)!" }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(cleanUsername).first();
    if (existingUser) {
      return NextResponse.json({ error: `Username '${cleanUsername}' sudah terdaftar oleh pengurus lain!` }, { status: 400 });
    }

    const permsStr = typeof permissions === "object" ? JSON.stringify(permissions) : JSON.stringify({
      pemasukan_view: true, pemasukan_write: false,
      pengeluaran_view: true, pengeluaran_write: false,
      santri_view: true, santri_write: false,
      tabungan_view: true, tabungan_write: false,
      tagihan_view: true, tagihan_write: false,
      laporan_view: true,
      pengaturan_view: false, pengaturan_write: false
    });

    // Generate default password hash for: ikwas2026
    const defaultPasswordHash = await hashPassword("ikwas2026");

    // Insert pengurus
    const insertPengurusResult = await db
      .prepare("INSERT INTO pengurus (name, role, permissions) VALUES (?, ?, ?)")
      .bind(name, role, permsStr)
      .run();

    const newPengurusId = insertPengurusResult.meta.last_row_id || insertPengurusResult.lastRowId;

    if (!newPengurusId) {
      throw new Error("Gagal mengambil ID pengurus baru.");
    }

    // Insert user credential with must_change_pw = 1
    await db
      .prepare("INSERT INTO users (pengurus_id, username, password_hash, must_change_pw) VALUES (?, ?, ?, 1)")
      .bind(newPengurusId, cleanUsername, defaultPasswordHash)
      .run();

    return NextResponse.json({ success: true, message: "Pengurus baru dan akun login berhasil ditambahkan dengan kata sandi bawaan 'ikwas2026'." });
  } catch (error: any) {
    console.error("POST pengurus error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as PengurusBody;
    const { id, permissions, action, name, role, username } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pengurus wajib diisi!" }, { status: 400 });
    }

    // Support Password Reset
    if (action === "reset_password") {
      const defaultPasswordHash = await hashPassword("ikwas2026");
      
      // Ensure user credential exists before updating, otherwise insert it
      const exists = await db.prepare("SELECT id FROM users WHERE pengurus_id = ?").bind(id).first();
      if (!exists) {
        // Find pengurus name to make username fallback
        const pengurus = await db.prepare("SELECT name FROM pengurus WHERE id = ?").bind(id).first() as any;
        const fallbackUsername = (pengurus?.name || `user_${id}`).toLowerCase().replace(/[^a-z0-9_]/g, '');
        await db
          .prepare("INSERT INTO users (pengurus_id, username, password_hash, must_change_pw) VALUES (?, ?, ?, 1)")
          .bind(id, fallbackUsername, defaultPasswordHash)
          .run();
      } else {
        await db
          .prepare("UPDATE users SET password_hash = ?, must_change_pw = 1 WHERE pengurus_id = ?")
          .bind(defaultPasswordHash, id)
          .run();
      }

      return NextResponse.json({ success: true, message: "Kata sandi berhasil di-reset kembali ke bawaan 'ikwas2026' dan wajib diganti saat masuk." });
    }

    // Support Profile Editing (name, role, username)
    if (action === "edit_profile") {
      if (!name || !role || !username) {
        return NextResponse.json({ error: "Nama, Jabatan, dan Username wajib diisi!" }, { status: 400 });
      }

      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
        return NextResponse.json({ error: "Username hanya boleh huruf kecil, angka, dan garis bawah (3-20 karakter)!" }, { status: 400 });
      }

      // Check if username already exists for other users
      const existingUser = await db.prepare("SELECT id FROM users WHERE username = ? AND pengurus_id != ?").bind(cleanUsername, id).first();
      if (existingUser) {
        return NextResponse.json({ error: `Username '${cleanUsername}' sudah terdaftar oleh pengurus lain!` }, { status: 400 });
      }

      // Update pengurus name & role
      await db
        .prepare("UPDATE pengurus SET name = ?, role = ? WHERE id = ?")
        .bind(name, role, id)
        .run();

      // Check if user credentials exists
      const userExists = await db.prepare("SELECT id FROM users WHERE pengurus_id = ?").bind(id).first();
      if (!userExists) {
        // Create user credentials with default password hash
        const defaultPasswordHash = await hashPassword("ikwas2026");
        await db
          .prepare("INSERT INTO users (pengurus_id, username, password_hash, must_change_pw) VALUES (?, ?, ?, 1)")
          .bind(id, cleanUsername, defaultPasswordHash)
          .run();
      } else {
        // Update username
        await db
          .prepare("UPDATE users SET username = ? WHERE pengurus_id = ?")
          .bind(cleanUsername, id)
          .run();
      }

      return NextResponse.json({ success: true, message: "Profil pengurus berhasil diperbarui." });
    }

    if (!permissions) {
      return NextResponse.json({ error: "Hak Akses wajib diisi!" }, { status: 400 });
    }

    const permsStr = typeof permissions === "object" ? JSON.stringify(permissions) : permissions;

    await db
      .prepare("UPDATE pengurus SET permissions = ? WHERE id = ?")
      .bind(permsStr, id)
      .run();

    return NextResponse.json({ success: true, message: "Hak akses pengurus berhasil diperbarui." });
  } catch (error: any) {
    console.error("PUT pengurus error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pengurus wajib disertakan!" }, { status: 400 });
    }

    // Protect Super Admin from deletion
    const pengurus = await db.prepare("SELECT * FROM pengurus WHERE id = ?").bind(id).first() as any;
    if (pengurus && pengurus.name === "Alfian Chandra") {
      return NextResponse.json({ error: "Akun Super Admin utama (Alfian Chandra) tidak boleh dihapus!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM pengurus WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Pengurus berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE pengurus error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

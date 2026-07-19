import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface PengurusBody {
  name?: string;
  role?: string;
  permissions?: Record<string, boolean> | string;
  id?: string | number;
}

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM pengurus ORDER BY id ASC").all();
    
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
    const { name, role, permissions } = body;

    if (!name || !role) {
      return NextResponse.json({ error: "Nama dan Jabatan wajib diisi!" }, { status: 400 });
    }

    const permsStr = typeof permissions === "object" ? JSON.stringify(permissions) : JSON.stringify({
      dashboard: true, pemasukan: false, pengeluaran: false, santri: false, laporan: true
    });

    await db
      .prepare("INSERT INTO pengurus (name, role, permissions) VALUES (?, ?, ?)")
      .bind(name, role, permsStr)
      .run();

    return NextResponse.json({ success: true, message: "Pengurus baru berhasil ditambahkan." });
  } catch (error: any) {
    console.error("POST pengurus error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as PengurusBody;
    const { id, permissions } = body;

    if (!id || !permissions) {
      return NextResponse.json({ error: "ID dan Hak Akses wajib diisi!" }, { status: 400 });
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
    if (pengurus && pengurus.role === "Super Admin") {
      return NextResponse.json({ error: "Super Admin tidak boleh dihapus!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM pengurus WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Pengurus berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE pengurus error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

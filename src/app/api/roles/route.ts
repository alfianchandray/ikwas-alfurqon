import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface RoleBody {
  id?: string | number;
  name?: string;
  defaultPermissions?: Record<string, boolean>;
}

export async function GET() {
  try {
    const db = getDb();
    const { results } = await db.prepare("SELECT * FROM roles ORDER BY id ASC").all();

    const parsedResults = (results as any[]).map((r) => ({
      ...r,
      defaultPermissions: typeof r.default_permissions === "string" ? JSON.parse(r.default_permissions) : r.default_permissions
    }));

    return NextResponse.json(parsedResults);
  } catch (error: any) {
    console.error("GET roles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json() as RoleBody;
    const { name, defaultPermissions } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama peran wajib diisi!" }, { status: 400 });
    }

    const permsStr = defaultPermissions ? JSON.stringify(defaultPermissions) : JSON.stringify({
      dashboard: true, pemasukan: false, pengeluaran: false, santri: false, laporan: true
    });

    await db
      .prepare("INSERT INTO roles (name, default_permissions) VALUES (?, ?)")
      .bind(name, permsStr)
      .run();

    return NextResponse.json({ success: true, message: "Peran (Role) baru berhasil dibuat." });
  } catch (error: any) {
    console.error("POST roles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json() as RoleBody;
    const { id, name, defaultPermissions } = body;

    if (!id || !name || !defaultPermissions) {
      return NextResponse.json({ error: "Data edit peran tidak lengkap!" }, { status: 400 });
    }

    const permsStr = JSON.stringify(defaultPermissions);

    // Prevent editing Super Admin name
    const role = await db.prepare("SELECT * FROM roles WHERE id = ?").bind(id).first() as any;
    if (role && role.name === "Super Admin" && name !== "Super Admin") {
      return NextResponse.json({ error: "Nama peran Super Admin bawaan tidak boleh diganti!" }, { status: 400 });
    }

    await db
      .prepare("UPDATE roles SET name = ?, default_permissions = ? WHERE id = ?")
      .bind(name, permsStr, id)
      .run();

    return NextResponse.json({ success: true, message: "Peran (Role) berhasil diperbarui." });
  } catch (error: any) {
    console.error("PUT roles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID peran wajib disertakan!" }, { status: 400 });
    }

    const role = await db.prepare("SELECT * FROM roles WHERE id = ?").bind(id).first() as any;
    if (role && role.name === "Super Admin") {
      return NextResponse.json({ error: "Peran Super Admin bawaan tidak boleh dihapus!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM roles WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Peran berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE roles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

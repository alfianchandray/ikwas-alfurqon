import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM santri ORDER BY id DESC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET santri error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { name?: string; wali?: string; kelas?: string; kelas_id?: string };
    const { name, wali, kelas, kelas_id } = body;

    if (!name || !wali || (!kelas && !kelas_id)) {
      return NextResponse.json({ error: "Semua kolom wajib diisi!" }, { status: 400 });
    }

    let kelasName = kelas || "";
    if (kelas_id) {
      const kelasRow = await db.prepare("SELECT name FROM kelas WHERE id = ?").bind(kelas_id).first() as any;
      if (kelasRow) {
        kelasName = kelasRow.name;
      }
    }

    await db
      .prepare("INSERT INTO santri (name, wali, kelas) VALUES (?, ?, ?)")
      .bind(name, wali, kelasName)
      .run();

    return NextResponse.json({ success: true, message: "Data santri baru berhasil disimpan." });
  } catch (error: any) {
    console.error("POST santri error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID santri wajib disertakan!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM santri WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Data santri berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE santri error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { id?: number; name?: string; wali?: string; kelas?: string; kelas_id?: string };
    const { id, name, wali, kelas, kelas_id } = body;

    if (!id || !name || !wali || (!kelas && !kelas_id)) {
      return NextResponse.json({ error: "Semua kolom wajib diisi!" }, { status: 400 });
    }

    let kelasName = kelas || "";
    if (kelas_id) {
      const kelasRow = await db.prepare("SELECT name FROM kelas WHERE id = ?").bind(kelas_id).first() as any;
      if (kelasRow) {
        kelasName = kelasRow.name;
      }
    }

    await db
      .prepare("UPDATE santri SET name = ?, wali = ?, kelas = ? WHERE id = ?")
      .bind(name, wali, kelasName, id)
      .run();

    return NextResponse.json({ success: true, message: "Data santri berhasil diperbarui." });
  } catch (error: any) {
    console.error("PUT santri error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const body = await req.json() as { name?: string; wali?: string; kelas?: string };
    const { name, wali, kelas } = body;

    if (!name || !wali || !kelas) {
      return NextResponse.json({ error: "Semua kolom wajib diisi!" }, { status: 400 });
    }

    await db
      .prepare("INSERT INTO santri (name, wali, kelas) VALUES (?, ?, ?)")
      .bind(name, wali, kelas)
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

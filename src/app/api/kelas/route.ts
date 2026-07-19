import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM kelas ORDER BY id ASC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET kelas error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { name?: string };
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama kelas wajib diisi!" }, { status: 400 });
    }

    await db
      .prepare("INSERT INTO kelas (name) VALUES (?)")
      .bind(name)
      .run();

    return NextResponse.json({ success: true, message: "Kelas baru berhasil ditambahkan." });
  } catch (error: any) {
    console.error("POST kelas error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kelas wajib disertakan!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM kelas WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Kelas berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE kelas error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

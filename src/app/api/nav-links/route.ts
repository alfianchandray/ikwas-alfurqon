import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM nav_links ORDER BY id ASC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET nav-links error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { name?: string; url?: string };
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "Nama dan URL wajib diisi!" }, { status: 400 });
    }

    await db
      .prepare("INSERT INTO nav_links (name, url) VALUES (?, ?)")
      .bind(name, url)
      .run();

    return NextResponse.json({ success: true, message: "Menu navigasi berhasil ditambahkan." });
  } catch (error: any) {
    console.error("POST nav-links error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID menu wajib disertakan!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM nav_links WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Menu navigasi berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE nav-links error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

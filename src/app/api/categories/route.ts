import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM categories ORDER BY id ASC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET categories error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { name?: string; tipe?: string };
    const { name, tipe } = body;

    if (!name || !tipe) {
      return NextResponse.json({ error: "Nama kategori dan Tipe wajib diisi!" }, { status: 400 });
    }

    await db
      .prepare("INSERT INTO categories (name, tipe) VALUES (?, ?)")
      .bind(name, tipe)
      .run();

    return NextResponse.json({ success: true, message: "Kategori transaksi berhasil ditambahkan." });
  } catch (error: any) {
    console.error("POST categories error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kategori wajib disertakan!" }, { status: 400 });
    }

    // Get category name
    const cat = await db.prepare("SELECT * FROM categories WHERE id = ?").bind(id).first() as any;
    if (!cat) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }

    const protectedNames = ['Iuran Wali'];
    if (protectedNames.includes(cat.name)) {
      return NextResponse.json({ error: `Kategori "${cat.name}" adalah kategori sistem wajib untuk tagihan iuran dan tidak boleh dihapus.` }, { status: 400 });
    }

    await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: `Kategori "${cat.name}" berhasil dihapus.` });
  } catch (error: any) {
    console.error("DELETE categories error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface TransaksiBody {
  kategori?: string;
  nominal?: number | string;
  keterangan?: string;
  tanggal?: string;
  tipe?: string;
  receiptImage?: string;
}

export async function GET() {
  try {
    const db = getDb();
    const { results } = await db.prepare("SELECT * FROM transaksi ORDER BY tanggal DESC, id DESC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET transaksi error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json() as TransaksiBody;
    const { kategori, nominal, keterangan, tanggal, tipe, receiptImage } = body;

    if (!kategori || !nominal || !tanggal || !tipe) {
      return NextResponse.json({ error: "Kolom wajib tidak boleh kosong!" }, { status: 400 });
    }

    // Clean nominal from formatting if string
    const nominalNumber = typeof nominal === "number" ? nominal : parseInt(String(nominal).replace(/[^0-9]/g, ""), 10);
    
    if (isNaN(nominalNumber) || nominalNumber <= 0) {
      return NextResponse.json({ error: "Nominal tidak valid!" }, { status: 400 });
    }

    await db
      .prepare("INSERT INTO transaksi (kategori, nominal, keterangan, tanggal, tipe, receipt_image) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(kategori, nominalNumber, keterangan || null, tanggal, tipe, receiptImage || null)
      .run();

    return NextResponse.json({ success: true, message: "Transaksi baru berhasil disimpan." });
  } catch (error: any) {
    console.error("POST transaksi error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID transaksi wajib disertakan!" }, { status: 400 });
    }

    await db.prepare("DELETE FROM transaksi WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus." });
  } catch (error: any) {
    console.error("DELETE transaksi error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

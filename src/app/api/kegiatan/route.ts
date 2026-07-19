import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface KegiatanBody {
  id?: string | number;
  amount?: number;
}

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM kegiatan ORDER BY id ASC").all();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET kegiatan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simulate penambahan dana kegiatan
export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as KegiatanBody;
    const { id, amount } = body;

    if (!id || amount === undefined) {
      return NextResponse.json({ error: "ID kegiatan dan nominal wajib diisi!" }, { status: 400 });
    }

    const currentKegiatan = await db
      .prepare("SELECT * FROM kegiatan WHERE id = ?")
      .bind(id)
      .first() as any;

    if (!currentKegiatan) {
      return NextResponse.json({ error: "Program kegiatan tidak ditemukan!" }, { status: 404 });
    }

    const newTerkumpul = Math.min(currentKegiatan.target, currentKegiatan.terkumpul + amount);

    await db
      .prepare("UPDATE kegiatan SET terkumpul = ? WHERE id = ?")
      .bind(newTerkumpul, id)
      .run();

    return NextResponse.json({ success: true, message: "Dana simulasi berhasil dialokasikan." });
  } catch (error: any) {
    console.error("POST kegiatan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Reset simulasi ke data awal
export async function PATCH() {
  try {
    const db = await getDb();
    
    // Clear and restore seed values
    await db.prepare("DELETE FROM kegiatan").run();
    await db
      .prepare(
        "INSERT INTO kegiatan (id, name, target, terkumpul, sumber, tenggat) VALUES " +
        "(1, 'Rihlah Akbar & Studi Banding Santri', 15000000, 12000000, '70% Tabungan Santri, 30% Kas Umum', 'Desember 2026')," +
        "(2, 'Pembangunan Perpustakaan Al-Furqon', 10000000, 3350000, '100% Infaq Sukarela', 'Maret 2027')"
      )
      .run();

    return NextResponse.json({ success: true, message: "Dana simulasi berhasil direset." });
  } catch (error: any) {
    console.error("PATCH kegiatan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

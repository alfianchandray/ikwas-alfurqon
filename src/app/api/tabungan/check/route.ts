import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { santriName: string; waliName: string };
    const { santriName, waliName } = body;

    if (!santriName || !waliName) {
      return NextResponse.json({ error: "Nama Santri dan Nama Wali harus diisi!" }, { status: 400 });
    }

    // 1. Find matching student and their savings account
    const query = `
      SELECT s.id as santri_id, s.name as santri_name, s.wali, k.name as kelas, r.id as rekening_id, r.saldo
      FROM santri s
      JOIN kelas k ON s.kelas_id = k.id
      JOIN rekening_tabungan r ON s.id = r.santri_id
      WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(?)) AND LOWER(TRIM(s.wali)) = LOWER(TRIM(?))
    `;

    const row = await db.prepare(query).bind(santriName, waliName).first() as any;

    if (!row) {
      return NextResponse.json({ 
        success: false, 
        error: "Data santri tidak ditemukan. Pastikan Nama Santri dan Nama Wali ditulis dengan benar sesuai data registrasi pondok." 
      });
    }

    // 2. Fetch last 5 mutations for this savings account
    const mutationsQuery = `
      SELECT id, tipe, nominal, keterangan, tanggal
      FROM transaksi_tabungan
      WHERE rekening_id = ?
      ORDER BY tanggal DESC, id DESC
      LIMIT 5
    `;
    const mutationsRes = await db.prepare(mutationsQuery).bind(row.rekening_id).all();
    const mutations = (mutationsRes.results || []).map((m: any) => ({
      ...m,
      tanggalFormatted: new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }));

    return NextResponse.json({
      success: true,
      data: {
        santriName: row.santri_name,
        waliName: row.wali,
        kelasName: row.kelas,
        saldo: row.saldo,
        mutations
      }
    });

  } catch (error: any) {
    console.error("POST /api/tabungan/check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    // Helper for cleaning titles (Bpk, Ibu, Ustadz, etc.) and punctuation
    const normalizeName = (str: string) => {
      return str
        .toLowerCase()
        .replace(/\b(bpk|bapak|ibu|ustadz|ustadzah|kh|h|hj|drs|dr|sp)\b\.?/gi, "")
        .replace(/[^a-z0-9\s]/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const cleanSantriReq = normalizeName(santriName);
    const cleanWaliReq = normalizeName(waliName);

    // 1. Fetch potential matching candidates from DB
    const query = `
      SELECT s.id as santri_id, s.name as santri_name, s.wali, k.name as kelas, r.id as rekening_id, r.saldo
      FROM santri s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN rekening_tabungan r ON s.id = r.santri_id
      WHERE LOWER(s.name) LIKE ? OR LOWER(s.wali) LIKE ?
    `;

    const searchSantriParam = `%${cleanSantriReq.split(' ')[0] || santriName.trim().toLowerCase()}%`;
    const searchWaliParam = `%${cleanWaliReq.split(' ')[0] || waliName.trim().toLowerCase()}%`;

    const candidatesRes = await db.prepare(query).bind(searchSantriParam, searchWaliParam).all();
    const candidates = candidatesRes.results || [];

    // 2. Perform Smart Normalized Fuzzy Matching
    const row: any = candidates.find((item: any) => {
      const cleanSantriDb = normalizeName(item.santri_name || "");
      const cleanWaliDb = normalizeName(item.wali || "");

      const santriOk = cleanSantriDb.includes(cleanSantriReq) || cleanSantriReq.includes(cleanSantriDb);
      const waliOk = cleanWaliDb.includes(cleanWaliReq) || cleanWaliReq.includes(cleanWaliDb);

      return santriOk && waliOk;
    }) || candidates[0]; // fallback to first candidate if fuzzy candidate matched

    if (!row || !row.rekening_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Data santri tidak ditemukan. Pastikan Nama Santri dan Nama Wali ditulis dengan benar sesuai data registrasi." 
      });
    }

    // 3. Fetch last 5 mutations for this savings account
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
        kelasName: row.kelas || 'Reguler',
        saldo: row.saldo || 0,
        mutations
      }
    });

  } catch (error: any) {
    console.error("POST /api/tabungan/check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

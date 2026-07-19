import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/ip";

// Helper: validate session
async function validateSession(req: NextRequest, db: any) {
  const token = req.cookies.get("ikwas_session")?.value;
  if (!token) return null;

  const session = await db
    .prepare(
      `SELECT s.user_id, u.username, p.role, p.name
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       JOIN pengurus p ON u.pengurus_id = p.id
       WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > datetime('now')`
    )
    .bind(token)
    .first() as any;

  return session || null;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const kategoriId = searchParams.get("kategori_id");
    const periode = searchParams.get("periode"); // Format: "2026-10" or custom string

    if (!kategoriId || !periode) {
      return NextResponse.json({ error: "kategori_id dan periode wajib dikirim." }, { status: 400 });
    }

    // 1. Get all active students
    const { results: students } = await db.prepare("SELECT s.id, s.name, s.wali, k.name as kelas FROM santri s LEFT JOIN kelas k ON s.kelas_id = k.id ORDER BY s.name ASC").all();

    // 2. Fetch standard nominal for this category
    const cat = await db.prepare("SELECT * FROM categories WHERE id = ?").bind(kategoriId).first() as any;
    if (!cat) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }

    // Nominal default: SPP/Iuran Wali = 150000, others can start at 0
    const defaultNominal = cat.name === "Iuran Wali" ? 150000 : 0;

    // 3. Auto-insert missing bill entries for each student
    for (const student of students) {
      const existing = await db
        .prepare("SELECT id FROM tagihan_santri WHERE santri_id = ? AND kategori_id = ? AND periode = ?")
        .bind(student.id, kategoriId, periode)
        .first() as any;

      if (!existing) {
        await db
          .prepare("INSERT INTO tagihan_santri (santri_id, kategori_id, periode, status, nominal) VALUES (?, ?, ?, 'belum_bayar', ?)")
          .bind(student.id, kategoriId, periode, defaultNominal)
          .run();
      }
    }

    // 4. Return complete bills list
    const { results: bills } = await db
      .prepare(
        `SELECT t.id as tagihan_id, t.periode, t.status, t.nominal, t.tanggal_bayar,
                s.name as santri_name, s.wali, k.name as kelas
         FROM tagihan_santri t
         JOIN santri s ON t.santri_id = s.id
         LEFT JOIN kelas k ON s.kelas_id = k.id
         WHERE t.kategori_id = ? AND t.periode = ?
         ORDER BY s.name ASC`
      )
      .bind(kategoriId, periode)
      .all();

    return NextResponse.json(bills);
  } catch (error: any) {
    console.error("GET tagihan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const session = await validateSession(req, db);
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body = await req.json() as {
      tagihan_id?: number;
      nominal?: number;
      keterangan?: string;
      tanggal?: string; // Format: YYYY-MM-DD
    };
    const { tagihan_id, nominal, keterangan, tanggal } = body;

    if (!tagihan_id || !nominal) {
      return NextResponse.json({ error: "tagihan_id dan nominal wajib diisi." }, { status: 400 });
    }

    // 1. Fetch bill details
    const bill = await db
      .prepare(
        `SELECT t.*, s.name as santri_name, s.wali, c.name as category_name
         FROM tagihan_santri t
         JOIN santri s ON t.santri_id = s.id
         JOIN categories c ON t.kategori_id = c.id
         WHERE t.id = ?`
      )
      .bind(tagihan_id)
      .first() as any;

    if (!bill) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 });
    }

    if (bill.status === "lunas") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas." }, { status: 400 });
    }

    // 2. Insert transaction entry into transaksi table (Pemasukan Kas)
    const ip = getClientIp(req);
    const cleanKeterangan = keterangan || `Pelunasan ${bill.category_name} - ${bill.santri_name} (Wali: ${bill.wali}) Periode ${bill.periode}`;
    const txTanggal = tanggal ? `${tanggal} 12:00:00` : null;

    const txResult = await db
      .prepare(
        `INSERT INTO transaksi (tanggal, nama, keterangan, kategori, nominal, tipe, user_id)
         VALUES (COALESCE(?, datetime('now', 'localtime')), ?, ?, ?, ?, 'in', ?)`
      )
      .bind(txTanggal, bill.santri_name, cleanKeterangan, bill.category_name, nominal, session.user_id)
      .run();

    // D1 changes: lastRowId contains inserted ID
    const insertedTxId = txResult.meta?.last_row_id || txResult.lastRowId;

    // 3. Update tagihan status to lunas
    await db
      .prepare(
        `UPDATE tagihan_santri 
         SET status = 'lunas', 
             nominal = ?, 
             tanggal_bayar = COALESCE(?, datetime('now', 'localtime')), 
             transaksi_id = ? 
         WHERE id = ?`
      )
      .bind(nominal, txTanggal, insertedTxId, tagihan_id)
      .run();

    // 4. Audit Log
    await db
      .prepare(
        `INSERT INTO activity_log (user_id, username, action, target_type, target_id, detail, ip_address, status) 
         VALUES (?, ?, 'PAY_BILL', 'tagihan_santri', ?, ?, ?, 'success')`
      )
      .bind(
        session.user_id,
        session.username,
        tagihan_id.toString(),
        `Pelunasan tagihan ${bill.category_name} santri ${bill.santri_name} nominal Rp ${nominal}`,
        ip
      )
      .run();

    return NextResponse.json({ success: true, message: `Pembayaran ${bill.category_name} berhasil disimpan.` });
  } catch (error: any) {
    console.error("POST tagihan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

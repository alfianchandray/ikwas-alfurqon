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
    const session = await validateSession(req, db);
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const santriId = searchParams.get("santri_id");

    if (santriId) {
      // Get single tabungan details + mutasi list
      const rekening = await db
        .prepare(
          `SELECT r.*, s.name as santri_name, s.wali, s.kelas
           FROM rekening_tabungan r
           JOIN santri s ON r.santri_id = s.id
           WHERE r.santri_id = ?`
        )
        .bind(santriId)
        .first() as any;

      if (!rekening) {
        // If not exist, auto-create
        const santri = await db
          .prepare("SELECT * FROM santri WHERE id = ?")
          .bind(santriId)
          .first() as any;

        if (!santri) {
          return NextResponse.json({ error: "Santri tidak ditemukan." }, { status: 404 });
        }

        await db
          .prepare("INSERT INTO rekening_tabungan (santri_id, saldo) VALUES (?, 0)")
          .bind(santriId)
          .run();

        const newRek = {
          santri_id: parseInt(santriId),
          saldo: 0,
          santri_name: santri.name,
          wali: santri.wali,
          kelas: santri.kelas,
        };

        return NextResponse.json({ rekening: newRek, mutasi: [] });
      }

      const { results: mutasi } = await db
        .prepare(
          `SELECT m.*, u.username as operator
           FROM mutasi_tabungan m
           LEFT JOIN users u ON m.user_id = u.id
           WHERE m.rekening_id = ?
           ORDER BY m.tanggal DESC, m.id DESC`
        )
        .bind(rekening.id)
        .all();

      return NextResponse.json({ rekening, mutasi });
    } else {
      // Get all rekening list (and auto-join all santri details even if balance is 0/not created yet)
      const { results } = await db
        .prepare(
          `SELECT s.id as santri_id, s.name as santri_name, s.wali, s.kelas,
                  COALESCE(r.id, 0) as rekening_id,
                  COALESCE(r.saldo, 0) as saldo
           FROM santri s
           LEFT JOIN rekening_tabungan r ON s.id = r.santri_id
           ORDER BY s.name ASC`
        )
        .all();

      return NextResponse.json(results);
    }
  } catch (error: any) {
    console.error("GET tabungan error:", error);
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
      santriId?: number | string;
      tipe?: 'setor' | 'tarik';
      nominal?: number | string;
      keterangan?: string;
    };
    const { santriId, tipe, nominal, keterangan } = body;

    if (!santriId || !tipe || !nominal) {
      return NextResponse.json({ error: "Input wajib tidak boleh kosong." }, { status: 400 });
    }

    const cleanNominal = typeof nominal === "number" ? nominal : parseInt(String(nominal).replace(/[^0-9]/g, ""), 10);
    if (isNaN(cleanNominal) || cleanNominal <= 0) {
      return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });
    }

    // 1. Ensure rekening exists (auto-create if not)
    let rekening = await db
      .prepare("SELECT * FROM rekening_tabungan WHERE santri_id = ?")
      .bind(santriId)
      .first() as any;

    if (!rekening) {
      await db
        .prepare("INSERT INTO rekening_tabungan (santri_id, saldo) VALUES (?, 0)")
        .bind(santriId)
        .run();

      rekening = await db
        .prepare("SELECT * FROM rekening_tabungan WHERE santri_id = ?")
        .bind(santriId)
        .first() as any;
    }

    // 2. Validate balance if penarikan (tarik)
    if (tipe === "tarik" && rekening.saldo < cleanNominal) {
      return NextResponse.json({ error: "Saldo tabungan santri tidak mencukupi untuk penarikan." }, { status: 400 });
    }

    // 3. Update saldo
    const newSaldo = tipe === "setor" ? rekening.saldo + cleanNominal : rekening.saldo - cleanNominal;
    await db
      .prepare("UPDATE rekening_tabungan SET saldo = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(newSaldo, rekening.id)
      .run();

    // 4. Record mutasi
    await db
      .prepare(
        "INSERT INTO mutasi_tabungan (rekening_id, user_id, tipe, nominal, keterangan) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(rekening.id, session.user_id, tipe, cleanNominal, keterangan || (tipe === 'setor' ? 'Setoran Tabungan' : 'Penarikan Tabungan'))
      .run();

    // 5. Log activity
    const ip = getClientIp(req);
    const detailLog = JSON.stringify({
      santri_id: santriId,
      tipe,
      nominal: cleanNominal,
      keterangan: keterangan || '',
      new_saldo: newSaldo,
    });
    
    await db.prepare(
      "INSERT INTO activity_log (user_id, username, action, target_type, target_id, detail, ip_address, status) VALUES (?, ?, 'MUTASI_TABUNGAN', 'rekening_tabungan', ?, ?, ?, 'success')"
    ).bind(session.user_id, session.username, rekening.id.toString(), detailLog, ip).run();

    return NextResponse.json({ success: true, message: `Transaksi ${tipe === 'setor' ? 'setoran' : 'penarikan'} berhasil diproses.`, saldo: newSaldo });
  } catch (error: any) {
    console.error("POST tabungan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

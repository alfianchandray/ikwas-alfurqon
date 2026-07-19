import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Total Pemasukan & Pengeluaran untuk Saldo Utama
    const trans = await db.prepare("SELECT tipe, SUM(nominal) as total FROM transaksi GROUP BY tipe").all();
    let totalIn = 0;
    let totalOut = 0;
    if (trans.results) {
      trans.results.forEach((row: any) => {
        if (row.tipe === 'in') totalIn = row.total || 0;
        if (row.tipe === 'out') totalOut = row.total || 0;
      });
    }
    const saldoUtama = totalIn - totalOut;

    // 2. Pemasukan hari ini
    const todayIn = await db.prepare(
      "SELECT SUM(nominal) as total FROM transaksi WHERE tipe = 'in' AND date(tanggal) = date('now', 'localtime')"
    ).first() as any;
    const pemasukanHariIni = todayIn?.total || 0;

    // 3. Pengeluaran hari ini
    const todayOut = await db.prepare(
      "SELECT SUM(nominal) as total FROM transaksi WHERE tipe = 'out' AND date(tanggal) = date('now', 'localtime')"
    ).first() as any;
    const pengeluaranHariIni = todayOut?.total || 0;

    // 4. Jumlah santri aktif
    const santriCount = await db.prepare("SELECT COUNT(*) as count FROM santri").first() as any;
    const totalSantri = santriCount?.count || 0;

    // 5. Hitung santri dengan iuran lunas periode ini (opsional)
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentPeriode = `${yyyy}-${mm}`;
    const bills = await db.prepare(
      "SELECT COUNT(*) as count, SUM(CASE WHEN status='lunas' THEN 1 ELSE 0 END) as lunas FROM tagihan_santri WHERE periode = ?"
    ).bind(currentPeriode).first() as any;
    
    const totalBills = bills?.count || 0;
    const billsLunas = bills?.lunas || 0;

    return NextResponse.json({
      saldoUtama,
      pemasukanHariIni,
      pengeluaranHariIni,
      totalIn,
      totalOut,
      totalSantri,
      totalBills,
      billsLunas,
      currentPeriode
    });
  } catch (error: any) {
    console.error("GET dashboard stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

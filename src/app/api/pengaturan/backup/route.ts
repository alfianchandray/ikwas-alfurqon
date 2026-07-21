import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const TABLES = [
  'site_config',
  'nav_links',
  'kelas',
  'pengurus',
  'users',
  'roles',
  'santri',
  'transaksi',
  'categories',
  'kegiatan',
  'rekening_tabungan',
  'mutasi_tabungan',
  'page_headers',
  'sidebar_menu',
  'tagihan_santri',
  'activity_log'
];

// GET: Export SQL Dump
export async function GET() {
  try {
    const db = await getDb();
    let sqlDump = `-- SALINAN DATA PORTAL KEUANGAN IKWAS AL-FURQON\n`;
    sqlDump += `-- Dibuat pada: ${new Date().toLocaleString("id-ID")}\n\n`;
    sqlDump += `PRAGMA foreign_keys = OFF;\n\n`;

    for (const table of TABLES) {
      sqlDump += `-- Data untuk tabel: ${table}\n`;
      sqlDump += `DELETE FROM ${table};\n`;

      const { results } = await db.prepare(`SELECT * FROM ${table}`).all();
      if (results && results.length > 0) {
        for (const row of results as any[]) {
          const keys = Object.keys(row);
          const cols = keys.join(", ");
          const vals = keys.map((key) => {
            const val = row[key];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number") return val.toString();
            // Escape single quotes for SQL string safety
            return `'${val.toString().replace(/'/g, "''")}'`;
          }).join(", ");

          sqlDump += `INSERT INTO ${table} (${cols}) VALUES (${vals});\n`;
        }
      }
      sqlDump += `\n`;
    }

    sqlDump += `PRAGMA foreign_keys = ON;\n`;

    return new NextResponse(sqlDump, {
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "Content-Disposition": `attachment; filename=Salinan_Data_IKWAS_${new Date().toISOString().split('T')[0]}.sql`,
      },
    });
  } catch (error: any) {
    console.error("Backup export error:", error);
    return NextResponse.json({ error: "Gagal membuat salinan data: " + error.message }, { status: 500 });
  }
}

// POST: Restore SQL Dump
export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json() as { sql?: string };
    const { sql } = body;

    if (!sql) {
      return NextResponse.json({ error: "Konten salinan data kosong atau tidak valid!" }, { status: 400 });
    }

    // Clean up lines and separate statements
    const statements = sql
      .split(";\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    // We execute them sequentially in a batch for transaction safety
    const preparedStatements = statements.map((stmt) => db.prepare(stmt));

    if (preparedStatements.length > 0) {
      await db.batch(preparedStatements);
    }

    return NextResponse.json({ success: true, message: "Seluruh data portal IKWAS berhasil dipulihkan dari salinan." });
  } catch (error: any) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Gagal memulihkan data: " + error.message }, { status: 500 });
  }
}

import { execSync } from 'child_process';
import * as fs from 'fs';

const sql = `
-- Migration to create rekening_tabungan and mutasi_tabungan
CREATE TABLE IF NOT EXISTS rekening_tabungan (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id      INTEGER NOT NULL UNIQUE,
    saldo          INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mutasi_tabungan (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    rekening_id    INTEGER NOT NULL,
    user_id        INTEGER,
    tipe           TEXT NOT NULL CHECK(tipe IN ('setor', 'tarik', 'bayar_program')), 
    nominal        INTEGER NOT NULL,
    keterangan     TEXT,
    tanggal        TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rekening_id) REFERENCES rekening_tabungan(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rekening_santri_id ON rekening_tabungan(santri_id);
CREATE INDEX IF NOT EXISTS idx_mutasi_rekening_id ON mutasi_tabungan(rekening_id);
`;

const tmpFile = 'migration-tabungan-temp.sql';
fs.writeFileSync(tmpFile, sql);

console.log('📦 Creating tabungan tables in local D1 database...');
try {
  execSync(`npx wrangler d1 execute ikwas-db --local --file=${tmpFile}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Tabungan tables migration complete!');
} catch (err) {
  console.error('❌ Migration failed:', err);
} finally {
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
}

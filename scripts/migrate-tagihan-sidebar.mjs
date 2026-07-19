import { execSync } from 'child_process';
import * as fs from 'fs';

const sql = `
-- Create sidebar_menu
CREATE TABLE IF NOT EXISTS sidebar_menu (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    path        TEXT NOT NULL UNIQUE,
    icon        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO sidebar_menu (name, path, icon, sort_order) VALUES
('Beranda', '/dashboard', 'dashboard', 1),
('Pemasukan', '/dashboard/pemasukan', 'arrow_circle_down', 2),
('Pengeluaran', '/dashboard/pengeluaran', 'arrow_circle_up', 3),
('Iuran & Tagihan', '/dashboard/santri', 'group', 4),
('Buku Tabungan', '/dashboard/tabungan', 'account_balance_wallet', 5),
('Laporan Keuangan', '/dashboard/laporan', 'description', 6),
('Pengguna', '/dashboard/pengguna', 'manage_accounts', 7);

-- Create tagihan_santri
CREATE TABLE IF NOT EXISTS tagihan_santri (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id     INTEGER NOT NULL,
    kategori_id   INTEGER NOT NULL,
    periode       TEXT NOT NULL,
    status        TEXT NOT NULL CHECK(status IN ('lunas', 'belum_bayar')),
    nominal       INTEGER NOT NULL DEFAULT 0,
    tanggal_bayar TEXT,
    transaksi_id  INTEGER,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tagihan_santri_id ON tagihan_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_kategori_id ON tagihan_santri(kategori_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_periode ON tagihan_santri(periode);
`;

const tmpFile = 'migration-tagihan-sidebar-temp.sql';
fs.writeFileSync(tmpFile, sql);

console.log('📦 Initializing sidebar_menu and tagihan_santri in local D1...');
try {
  execSync(`npx wrangler d1 execute ikwas-db --local --file=${tmpFile}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Tables created and initial seeds injected!');
} catch (err) {
  console.error('❌ Migration failed:', err);
} finally {
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
}

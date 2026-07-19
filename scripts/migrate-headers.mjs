import { execSync } from 'child_process';
import * as fs from 'fs';

const sql = `
-- Migration to create page_headers
CREATE TABLE IF NOT EXISTS page_headers (
    path        TEXT PRIMARY KEY,
    badge       TEXT,
    title       TEXT NOT NULL,
    description TEXT
);

INSERT OR IGNORE INTO page_headers (path, badge, title, description) VALUES
('/dashboard', 'Ikhtisar', 'Beranda Keuangan', 'Selamat datang di panel utama pengelolaan keuangan IKWAS Al-Furqon. Amanah, transparan, dan realtime.'),
('/dashboard/pemasukan', 'Kas Masuk', 'Form Pemasukan Pintar', 'Pencatatan pemasukan kas secara otomatis mendeteksi relasi wali santri secara kondisional.'),
('/dashboard/pengeluaran', 'Kas Keluar', 'Form Pengeluaran Baru', 'Pencatatan kas keluar secara profesional dilengkapi dengan manajemen unggah bukti bayar kuitansi.'),
('/dashboard/santri', 'Manajemen Santri', 'Data Santri & Wali', 'Pengelolaan data santri beserta wali murid guna mempermudah penagihan iuran dan tabungan wadiah.'),
('/dashboard/tabungan', 'Modul Wadiah', 'Buku Tabungan Santri', 'Pencatatan titipan dana pribadi santri terpisah dari iuran wajib dan kas operasional yayasan.'),
('/dashboard/laporan', 'Buku Besar', 'Laporan Keuangan', 'Laporan arus kas masuk dan keluar secara terperinci dilengkapi dengan kuitansi fisik.'),
('/dashboard/pengguna', 'Manajemen Akses', 'Pengurus & Hak Akses', 'Pengaturan peran pengguna yayasan serta peninjauan log aktivitas audit keamanan.'),
('/dashboard/pengaturan', 'Sistem', 'Pengaturan Situs', 'Kelola visual, ornamen branding Islami, tautan navigasi portal publik, data kelas, serta ganti kata sandi pribadi Anda.');
`;

const tmpFile = 'migration-headers-temp.sql';
fs.writeFileSync(tmpFile, sql);

console.log('📦 Creating page_headers table and seeding initial values in local D1...');
try {
  execSync(`npx wrangler d1 execute ikwas-db --local --file=${tmpFile}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Headers migration and seeding complete!');
} catch (err) {
  console.error('❌ Migration failed:', err);
} finally {
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
}

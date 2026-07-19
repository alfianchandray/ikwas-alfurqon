-- IKWAS Al-Furqon Database Schema & Initial Seed Data

-- 1. Site Config Table
CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name TEXT NOT NULL DEFAULT 'IKWAS Al-Furqon',
    site_desc TEXT NOT NULL,
    theme_color TEXT NOT NULL DEFAULT 'teal',
    logo_type TEXT NOT NULL DEFAULT 'medallion',
    favicon_url TEXT,
    logo_url TEXT
);

INSERT OR IGNORE INTO site_config (id, site_name, site_desc, theme_color, logo_type, favicon_url, logo_url) 
VALUES (1, 'IKWAS Al-Furqon', 'Sistem manajemen keuangan terpadu Ikatan Keluarga Santri dengan amanah dan transparan.', 'teal', 'medallion', '', '');

-- 2. Public Nav Links Table
CREATE TABLE IF NOT EXISTS nav_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL
);

INSERT OR IGNORE INTO nav_links (id, name, url) VALUES 
(1, 'Beranda', '#beranda'),
(2, 'Ringkasan', '#ringkasan'),
(3, 'Buku Besar', '#buku-besar');

-- 3. Kelas Santri Table
CREATE TABLE IF NOT EXISTS kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO kelas (id, name) VALUES 
(1, 'A - Ula'),
(2, 'B - Ula'),
(3, 'A - Wustho'),
(4, 'B - Wustho'),
(5, 'A - Ulya');

-- 4. Pengurus & RBAC Table
CREATE TABLE IF NOT EXISTS pengurus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    permissions TEXT NOT NULL -- JSON stringified permissions
);

INSERT OR IGNORE INTO pengurus (id, name, role, permissions) VALUES 
(1, 'Ustadz Ahmad', 'Super Admin', '{"dashboard":true,"pemasukan":true,"pengeluaran":true,"santri":true,"laporan":true}'),
(2, 'Ustadzah Fatimah', 'Bendahara Pemasukan', '{"dashboard":true,"pemasukan":true,"pengeluaran":false,"santri":true,"laporan":false}'),
(3, 'Bpk. Hasanudin', 'Bendahara Pengeluaran', '{"dashboard":true,"pemasukan":false,"pengeluaran":true,"santri":false,"laporan":true}');

-- 5. Santri & Wali Table
CREATE TABLE IF NOT EXISTS santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    wali TEXT NOT NULL,
    kelas TEXT NOT NULL
);

-- 6. Transaksi Kas Table
CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori TEXT NOT NULL,
    nominal INTEGER NOT NULL,
    keterangan TEXT,
    tanggal TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK(tipe IN ('in', 'out')),
    receipt_image TEXT
);

-- 7. Kategori Transaksi Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    tipe TEXT NOT NULL CHECK(tipe IN ('in', 'out'))
);

INSERT OR IGNORE INTO categories (id, name, tipe) VALUES 
(1, 'Iuran Wali', 'in'),
(2, 'Tabungan', 'in'),
(3, 'Hibah', 'in'),
(4, 'Operasional', 'out'),
(5, 'Pendidikan', 'out'),
(6, 'Logistik', 'out');

-- 8. Rencana Kegiatan BI Table
CREATE TABLE IF NOT EXISTS kegiatan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    target INTEGER NOT NULL,
    terkumpul INTEGER NOT NULL DEFAULT 0,
    sumber TEXT NOT NULL,
    tenggat TEXT NOT NULL
);

-- 9. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL UNIQUE,
    default_permissions TEXT    NOT NULL -- JSON stringified
);

INSERT OR IGNORE INTO roles (id, name, default_permissions) VALUES
(1, 'Super Admin', '{"dashboard":true,"pemasukan":true,"pengeluaran":true,"santri":true,"laporan":true}'),
(2, 'Bendahara Pemasukan', '{"dashboard":true,"pemasukan":true,"pengeluaran":false,"santri":true,"laporan":false}'),
(3, 'Bendahara Pengeluaran', '{"dashboard":true,"pemasukan":false,"pengeluaran":true,"santri":false,"laporan":true}');

-- 10. Users (Kredensial Login) Table
-- password_hash format: "<salt_hex>:<hash_hex>" via PBKDF2-SHA256-310k
-- NOTE: password_hash value '__PENDING__' is a placeholder — will be replaced by migrate script
CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    pengurus_id    INTEGER NOT NULL UNIQUE,
    username       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash  TEXT    NOT NULL,
    is_active      INTEGER NOT NULL DEFAULT 1,
    must_change_pw INTEGER NOT NULL DEFAULT 0,
    last_login     TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pengurus_id) REFERENCES pengurus(id) ON DELETE CASCADE
);

-- NOTE: Real hashes are inserted by the migration script (migrate-auth.js)
-- Placeholder rows so schema is valid — will be REPLACED by migrate script
INSERT OR IGNORE INTO users (id, pengurus_id, username, password_hash, must_change_pw)
VALUES
    (1, 1, 'superadmin', '__PENDING__', 0),
    (2, 2, 'bendahara1', '__PENDING__', 1),
    (3, 3, 'bendahara2', '__PENDING__', 1);

-- 11. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    token       TEXT    NOT NULL UNIQUE,
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT    NOT NULL,
    is_revoked  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 12. Activity Log Table (retention: 90 days, Super Admin only)
CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    username    TEXT,
    action      TEXT    NOT NULL,
    target_type TEXT,
    target_id   TEXT,
    detail      TEXT,
    ip_address  TEXT,
    status      TEXT    NOT NULL DEFAULT 'success',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- 13. Rekening Tabungan Santri (Titipan Wadiah)
CREATE TABLE IF NOT EXISTS rekening_tabungan (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id      INTEGER NOT NULL UNIQUE,
    saldo          INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
);

-- 14. Mutasi Buku Tabungan Pribadi
CREATE TABLE IF NOT EXISTS mutasi_tabungan (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    rekening_id    INTEGER NOT NULL,
    user_id        INTEGER, -- Admin yang memproses mutasi
    tipe           TEXT NOT NULL CHECK(tipe IN ('setor', 'tarik', 'bayar_program')), 
    nominal        INTEGER NOT NULL,
    keterangan     TEXT,
    tanggal        TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rekening_id) REFERENCES rekening_tabungan(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rekening_santri_id ON rekening_tabungan(santri_id);
CREATE INDEX IF NOT EXISTS idx_mutasi_rekening_id ON mutasi_tabungan(rekening_id);

-- 15. Page Headers (CMS Dynamic Titles)
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

-- 16. Sidebar Menu (CMS Dynamic Sidebar Navigation)
CREATE TABLE IF NOT EXISTS sidebar_menu (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    path        TEXT NOT NULL UNIQUE,
    icon        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    placeholder TEXT DEFAULT 'Cari data...'
);

INSERT OR IGNORE INTO sidebar_menu (name, path, icon, sort_order, placeholder) VALUES
('Beranda', '/dashboard', 'dashboard', 1, 'Cari aktivitas...'),
('Pemasukan', '/dashboard/pemasukan', 'arrow_circle_down', 2, 'Cari pemasukan...'),
('Pengeluaran', '/dashboard/pengeluaran', 'arrow_circle_up', 3, 'Cari pengeluaran...'),
('Iuran & Tagihan', '/dashboard/santri', 'group', 4, 'Cari nama santri, wali...'),
('Buku Tabungan', '/dashboard/tabungan', 'account_balance_wallet', 5, 'Cari nama santri, rekening...'),
('Laporan Keuangan', '/dashboard/laporan', 'description', 6, 'Cari transaksi, keterangan...'),
('Pengguna', '/dashboard/pengguna', 'manage_accounts', 7, 'Cari pengurus...');

-- 17. Tagihan Dinamis Santri (Berelasi ke Kategori)
CREATE TABLE IF NOT EXISTS tagihan_santri (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id     INTEGER NOT NULL,
    kategori_id   INTEGER NOT NULL, -- Berelasi ke categories.id
    periode       TEXT NOT NULL,    -- Misal: "2026-10" atau "Uang Kitab 2026"
    status        TEXT NOT NULL CHECK(status IN ('lunas', 'belum_bayar')),
    nominal       INTEGER NOT NULL DEFAULT 0,
    tanggal_bayar TEXT,
    transaksi_id  INTEGER,          -- Relasi ke transaksi kas umum
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tagihan_santri_id ON tagihan_santri(santri_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_kategori_id ON tagihan_santri(kategori_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_periode ON tagihan_santri(periode);




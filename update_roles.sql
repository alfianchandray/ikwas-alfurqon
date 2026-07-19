CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    default_permissions TEXT NOT NULL
);

INSERT OR IGNORE INTO roles (id, name, default_permissions) VALUES 
(1, 'Super Admin', '{"dashboard":true,"pemasukan":true,"pengeluaran":true,"santri":true,"laporan":true}'),
(2, 'Bendahara Pemasukan', '{"dashboard":true,"pemasukan":true,"pengeluaran":false,"santri":true,"laporan":false}'),
(3, 'Bendahara Pengeluaran', '{"dashboard":true,"pemasukan":false,"pengeluaran":true,"santri":false,"laporan":true}'),
(4, 'Admin Utama', '{"dashboard":true,"pemasukan":true,"pengeluaran":true,"santri":true,"laporan":true}');

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/atoms/Icon';

export default function PublicDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [navLinks, setNavLinks] = useState<{ id: string; name: string; url: string }[]>([]);
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'IKWAS Al-Furqon',
    siteDesc: 'Sistem manajemen keuangan terpadu Ikatan Keluarga Santri dengan amanah dan transparan.',
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch site config
    fetch('/api/site-config')
      .then(res => res.json())
      .then((data: any) => {
        if (data && data.site_name) {
          setSiteConfig({
            siteName: data.site_name,
            siteDesc: data.site_desc,
          });
        }
      })
      .catch(() => {
        const savedConfig = localStorage.getItem('ikwas_site_config');
        if (savedConfig) setSiteConfig(JSON.parse(savedConfig));
      });

    // 2. Fetch nav links
    fetch('/api/nav-links')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          setNavLinks(data);
        } else {
          throw new Error("Empty nav links");
        }
      })
      .catch(() => {
        const savedNavLinks = localStorage.getItem('ikwas_nav_menu');
        if (savedNavLinks) {
          setNavLinks(JSON.parse(savedNavLinks));
        } else {
          setNavLinks([
            { id: '1', name: 'Beranda', url: '#beranda' },
            { id: '2', name: 'Ringkasan', url: '#ringkasan' },
            { id: '3', name: 'Buku Besar', url: '#buku-besar' },
          ]);
        }
      });

    // 3. Fetch transactions
    fetch('/api/transaksi')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((t: any) => {
            // Mask wali/donator name for public privacy
            let maskedWali = '-';
            if (t.keterangan && t.keterangan.includes('Santri:')) {
              const baseName = t.keterangan.split('Santri:')[0].replace('Wali:', '').trim();
              maskedWali = baseName.split(' ').map((p: string) => p.length > 2 ? p.substring(0, 2) + '*'.repeat(p.length - 2) : p).join(' ');
            } else if (t.kategori === 'Iuran Wali' || t.kategori === 'Tabungan') {
              maskedWali = 'Wali Santri';
            }
            return {
              tgl: new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
              wali: maskedWali,
              ket: t.keterangan || 'Catatan transaksi kas',
              kat: t.kategori,
              nom: `${t.tipe === 'in' ? '+' : '-'}Rp ${new Intl.NumberFormat('id-ID').format(t.nominal)}`,
              tipe: t.tipe
            };
          });
          setTransactions(formatted);
        } else {
          throw new Error("No data");
        }
      })
      .catch(() => {
        // Fallback
        setTransactions([
          { tgl: '12 Okt 2023', wali: 'Ah*** Ra***', ket: 'Infaq Bulanan', kat: 'Pemasukan', nom: '+Rp 150.000', tipe: 'in' },
          { tgl: '11 Okt 2023', wali: 'Fa*** Nu***', ket: 'Sumbangan Pembangunan', kat: 'Pemasukan', nom: '+Rp 2.000.000', tipe: 'in' },
          { tgl: '10 Okt 2023', wali: '-', ket: 'Listrik & Air Asrama', kat: 'Operasional', nom: '-Rp 1.450.000', tipe: 'out' },
          { tgl: '09 Okt 2023', wali: 'Mu*** Az***', ket: 'Zakat Mal', kat: 'Pemasukan', nom: '+Rp 500.000', tipe: 'in' },
          { tgl: '08 Okt 2023', wali: 'Si*** Ma***', ket: 'Infaq Sukarela', kat: 'Pemasukan', nom: '+Rp 75.000', tipe: 'in' }
        ]);
      });
  }, []);

  const filteredTransactions = transactions.filter(t => 
    t.ket.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.wali.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.kat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* TopNavBar Publik */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl shadow-md border-b border-primary/10 select-none">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white relative">
              {/* Islamic Star SVG Logo */}
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="1.5" transform="rotate(0 12 12)" />
                <rect x="6" y="6" width="12" height="12" rx="1.5" transform="rotate(45 12 12)" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <span className="font-bold text-lg md:text-xl text-primary tracking-tight">{siteConfig.siteName}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.id}
                className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors"
                href={link.url}
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="primary-gradient text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Catat Keuangan
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto w-full" id="beranda">
        {/* Hero Section & CTA */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2 inline-block">Portal Publik</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-none mb-2">
              Transparansi Keuangan Ummat
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant font-medium leading-relaxed">
              Laporan real-time pengelolaan dana santri IKWAS. Mewujudkan akuntabilitas yang bersih, amanah, dan profesional.
            </p>
          </div>
          <div className="flex gap-4 justify-center md:justify-end">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
                <Icon name="verified_user" className="text-xl" fill={true} />
              </div>
              <div className="text-left">
                <p className="text-xs text-on-surface-variant font-medium">Status Laporan</p>
                <p className="text-sm font-bold text-primary">Terverifikasi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" id="ringkasan">
          {/* Saldo Kas Card */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="account_balance_wallet" className="text-lg" />
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Total Saldo</span>
            </div>
            <h3 className="text-sm text-on-surface-variant font-semibold mb-1">Saldo Kas Saat Ini</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">Rp</span>
              <span className="text-3xl font-extrabold text-on-surface tracking-tight">142.850.000</span>
            </div>
            <p className="mt-4 text-xs text-on-surface-variant flex items-center gap-1">
              <Icon name="trending_up" className="text-sm text-primary" />
              <span className="text-primary font-bold">+12%</span> dari bulan lalu
            </p>
          </div>

          {/* Pemasukan Card */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <Icon name="payments" className="text-lg" />
              </div>
              <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">Bulan Ini</span>
            </div>
            <h3 className="text-sm text-on-surface-variant font-semibold mb-1">Total Pemasukan</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">Rp</span>
              <span className="text-3xl font-extrabold text-on-surface tracking-tight">24.500.000</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-6">
              <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Pengeluaran Card */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-error-container/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center">
                <Icon name="shopping_cart_checkout" className="text-lg" />
              </div>
              <span className="text-xs font-bold text-error bg-error/10 px-3 py-1 rounded-full">Bulan Ini</span>
            </div>
            <h3 className="text-sm text-on-surface-variant font-semibold mb-1">Total Pengeluaran</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-error">Rp</span>
              <span className="text-3xl font-extrabold text-on-surface tracking-tight">8.120.000</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant font-semibold">
              <span>Target Anggaran</span>
              <span>33% Terpakai</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Tren Kas Bulanan</h2>
                <p className="text-xs text-on-surface-variant font-medium">Visualisasi performa keuangan 6 bulan terakhir</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-surface-container-high rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-colors duration-200">6 Bulan</button>
                <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">1 Tahun</button>
              </div>
            </div>
            <div className="h-80 relative flex items-end gap-4 px-2 pt-10">
              {/* Fake Chart Visualization */}
              <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full bg-primary/20 rounded-t-xl transition-all duration-300 group-hover:bg-primary/40 h-[40%]"></div>
                <span className="text-xs text-on-surface-variant font-semibold">Jan</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full bg-primary/20 rounded-t-xl transition-all duration-300 group-hover:bg-primary/40 h-[55%]"></div>
                <span className="text-xs text-on-surface-variant font-semibold">Feb</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full bg-primary/20 rounded-t-xl transition-all duration-300 group-hover:bg-primary/40 h-[45%]"></div>
                <span className="text-xs text-on-surface-variant font-semibold">Mar</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full bg-primary/20 rounded-t-xl transition-all duration-300 group-hover:bg-primary/40 h-[70%]"></div>
                <span className="text-xs text-on-surface-variant font-semibold">Apr</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full bg-primary/20 rounded-t-xl transition-all duration-300 group-hover:bg-primary/40 h-[85%]"></div>
                <span className="text-xs text-on-surface-variant font-semibold">Mei</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full bg-primary/20 rounded-t-xl transition-all duration-300 group-hover:bg-primary/40 h-[65%]"></div>
                <span className="text-xs text-on-surface-variant font-semibold">Jun</span>
              </div>
              {/* Line Overlay Simulation */}
              <svg className="absolute bottom-10 left-0 w-full h-[80%] pointer-events-none" viewBox="0 0 600 200" preserveAspectRatio="none">
                <path d="M0,150 Q100,120 200,140 T400,60 T600,80" fill="none" stroke="#0D9488" strokeWidth="4" strokeLinecap="round"></path>
                <circle cx="200" cy="140" fill="#0D9488" r="6"></circle>
                <circle cx="400" cy="60" fill="#0D9488" r="6"></circle>
                <circle cx="600" cy="80" fill="#0D9488" r="6"></circle>
              </svg>
            </div>
          </div>
          <div className="glass-card p-6 rounded-3xl flex flex-col justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-on-surface mb-2">Statistik Santri</h2>
              <p className="text-xs text-on-surface-variant font-medium">Distribusi data kontribusi santri aktif</p>
            </div>
            <div className="relative w-48 h-48 mx-auto my-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3.5"></path>
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="65, 100" strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-on-surface">842</span>
                <span className="text-xs text-on-surface-variant font-semibold">Santri Aktif</span>
              </div>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 font-semibold text-on-surface-variant">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full"></span> Terbayar (65%)
                </span>
                <span className="font-bold text-on-surface">547 Santri</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 font-semibold text-on-surface-variant">
                  <span className="w-2.5 h-2.5 bg-surface-container-high rounded-full"></span> Belum Bayar (35%)
                </span>
                <span className="font-bold text-on-surface">295 Santri</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buku Besar Publik */}
        <div className="glass-card rounded-3xl shadow-sm overflow-hidden mb-10 border border-white/20" id="buku-besar">
          <div className="p-6 border-b border-white/20 flex justify-between items-center flex-wrap gap-4 bg-white/30">
            <div className="text-left">
              <h2 className="text-xl font-bold text-on-surface">Buku Besar Publik (Terdampak Masking)</h2>
              <p className="text-xs text-on-surface-variant font-medium">Menampilkan 5 transaksi terakhir untuk keamanan privasi wali santri</p>
            </div>
            <div className="flex items-center gap-2 bg-white/80 p-2.5 px-4 rounded-2xl border border-primary/10 w-full sm:w-auto">
              <Icon name="search" className="text-primary text-base" />
              <input 
                className="bg-transparent border-none outline-none text-xs w-full sm:w-48 placeholder:text-on-surface-variant/40 text-on-surface font-semibold" 
                placeholder="Cari transaksi..." 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-primary text-xs font-bold border-b border-primary/10">
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Nama Wali (Masking)</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTransactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 transition-colors duration-150">
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{t.tgl}</td>
                    <td className="px-6 py-4 text-xs font-bold text-on-surface">{t.wali}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{t.ket}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        t.tipe === 'in' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'
                      }`}>{t.kat}</span>
                    </td>
                    <td className={`px-6 py-4 text-xs font-bold text-right ${t.tipe === 'in' ? 'text-primary' : 'text-error'}`}>{t.nom}</td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-on-surface-variant font-semibold">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-surface-container-low/30 flex items-center justify-between border-t border-white/20">
            <p className="text-xs font-bold text-on-surface-variant">Menampilkan {filteredTransactions.length} dari 5 transaksi</p>
            <div className="flex gap-2">
              <Link href="/login" className="px-4 py-2 rounded-xl border border-primary/20 text-primary font-bold text-xs hover:bg-primary/5 transition-colors duration-150">
                Lihat Semua
              </Link>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="relative overflow-hidden primary-gradient rounded-[2rem] p-10 text-center text-white shadow-xl shadow-primary/10">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0L55 45L100 50L55 55L50 100L45 55L0 50L45 45L50 0Z\' fill=\'%23ffffff\'/%3E%3C/svg%3E')", backgroundSize: '100px 100px' }}></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Siap Membantu Manajemen Keuangan?</h2>
            <p className="text-sm md:text-base text-on-primary-container/80 mb-6 max-w-[576px] mx-auto font-medium">
              Masuk sebagai pengurus untuk mulai mencatat transaksi dan mengelola data santri secara profesional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-white text-primary px-10 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all duration-200">
                Catat Keuangan Sekarang
              </Link>
              <a href="#" className="bg-primary-container text-white border border-white/20 px-10 py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all duration-200">
                Panduan Penggunaan
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 border-t border-primary/10 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white relative">
                  {/* Islamic Star SVG Logo */}
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="12" height="12" rx="1.5" transform="rotate(0 12 12)" />
                    <rect x="6" y="6" width="12" height="12" rx="1.5" transform="rotate(45 12 12)" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </div>
                <span className="font-bold text-base text-primary">{siteConfig.siteName}</span>
              </div>
              <p className="text-xs font-semibold text-on-surface-variant max-w-[384px] leading-relaxed">
                {siteConfig.siteDesc}
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-xs text-on-surface mb-4">Tautan Cepat</h4>
              <ul className="space-y-2">
                <li><a className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">Dashboard</a></li>
                <li><a className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">Laporan Tahunan</a></li>
                <li><a className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">FAQ</a></li>
              </ul>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-xs text-on-surface mb-4">Hubungi Kami</h4>
              <p className="text-xs font-semibold text-on-surface-variant mb-4">info@ikwasalfurqon.or.id</p>
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200" href="#">
                  <Icon name="language" className="text-lg" />
                </a>
                <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200" href="#">
                  <Icon name="mail" className="text-lg" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-primary/10 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">
              © 2026 {siteConfig.siteName}. Dikembangkan dengan penuh amanah untuk kemaslahatan ummat.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import FormField from '@/components/molecules/FormField';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Toast from '@/components/molecules/Toast';

interface Kegiatan {
  id: string;
  name: string;
  target: number;
  terkumpul: number;
  sumber: string;
  tenggat: string;
}

export default function InternalDashboard() {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'bi'>('ringkasan');
  const [siteName, setSiteName] = useState('IKWAS Al-Furqon');

  // BI state for simulation
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([
    {
      id: '1',
      name: 'Rihlah Akbar & Studi Banding Santri',
      target: 15000000,
      terkumpul: 12000000,
      sumber: '70% Tabungan Santri, 30% Kas Umum',
      tenggat: 'Desember 2026',
    },
    {
      id: '2',
      name: 'Pembangunan Perpustakaan Al-Furqon',
      target: 10000000,
      terkumpul: 3350000,
      sumber: '100% Infaq Sukarela',
      tenggat: 'Maret 2027',
    },
  ]);

  // Form input for simulating additions
  const [selectedKegiatanId, setSelectedKegiatanId] = useState('1');
  const [simulationAmount, setSimulationAmount] = useState('');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');

  const fetchConfig = () => {
    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.site_name) setSiteName(data.site_name);
      })
      .catch(() => {
        const savedConfig = localStorage.getItem('ikwas_site_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.siteName) setSiteName(config.siteName);
        }
      });
  };

  const fetchKegiatan = () => {
    fetch('/api/kegiatan')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setKegiatanList(data);
        }
      })
      .catch(() => {
        // Fallback mock
        setKegiatanList([
          {
            id: '1',
            name: 'Rihlah Akbar & Studi Banding Santri',
            target: 15000000,
            terkumpul: 12000000,
            sumber: '70% Tabungan Santri, 30% Kas Umum',
            tenggat: 'Desember 2026',
          },
          {
            id: '2',
            name: 'Pembangunan Perpustakaan Al-Furqon',
            target: 10000000,
            terkumpul: 3350000,
            sumber: '100% Infaq Sukarela',
            tenggat: 'Maret 2027',
          },
        ]);
      });
  };

  const [userName, setUserName] = useState('Ustadz Ahmad');
  const [userRole, setUserRole] = useState('Pengurus');
  const [timeGreeting, setTimeGreeting] = useState('Selamat bekerja');
  const [stats, setStats] = useState({
    saldoUtama: 0,
    pemasukanHariIni: 0,
    pengeluaranHariIni: 0,
    totalSantri: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchStats = () => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && !data.error) {
          setStats({
            saldoUtama: data.saldoUtama || 0,
            pemasukanHariIni: data.pemasukanHariIni || 0,
            pengeluaranHariIni: data.pengeluaranHariIni || 0,
            totalSantri: data.totalSantri || 0,
          });
        }
      })
      .catch(() => {});
  };

  const fetchRecentTransactions = () => {
    fetch('/api/transaksi')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setRecentTransactions(data.slice(0, 5));
        }
      })
      .catch(() => {});
  };

  // Load configuration
  useEffect(() => {
    fetchConfig();
    fetchKegiatan();
    fetchStats();
    fetchRecentTransactions();

    // Load dynamic username
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ikwas_user') : null;
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.name) setUserName(user.name);
        if (user.role) setUserRole(user.role);
      } catch {}
    } else {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.user) {
            if (data.user.name) setUserName(data.user.name);
            if (data.user.role) setUserRole(data.user.role);
          }
        })
        .catch(() => {});
    }

    // Calculate time greeting based on local client hours (WIB)
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setTimeGreeting('Selamat pagi');
    } else if (hour >= 11 && hour < 15) {
      setTimeGreeting('Selamat siang');
    } else if (hour >= 15 && hour < 18) {
      setTimeGreeting('Selamat sore');
    } else {
      setTimeGreeting('Selamat malam');
    }
  }, []);

  // Simulate allocation
  const handleSimulateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(simulationAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setToastMessage('Nominal simulasi tidak valid!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    fetch('/api/kegiatan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedKegiatanId,
        amount,
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      if (data.success) {
        setToastMessage('Alokasi dana berhasil disimulasikan ke kegiatan!');
        setToastType('success');
        setShowToast(true);
        setSimulationAmount('');
        fetchKegiatan();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setToastMessage(err.message || 'Gagal memproses alokasi.');
      setToastType('error');
      setShowToast(true);
    });
  };

  const handleResetSimulation = () => {
    fetch('/api/kegiatan', {
      method: 'PATCH',
    })
    .then((res) => res.json())
    .then((data: any) => {
      if (data.success) {
        setToastMessage('Simulasi berhasil dikembalikan ke data awal.');
        setToastType('warning');
        setShowToast(true);
        fetchKegiatan();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setToastMessage(err.message || 'Gagal mereset simulasi.');
      setToastType('error');
      setShowToast(true);
    });
  };

  // BI calculations
  const totalTarget = kegiatanList.reduce((acc, k) => acc + k.target, 0);
  const totalTerkumpul = kegiatanList.reduce((acc, k) => acc + k.terkumpul, 0);
  const totalDefisit = totalTarget - totalTerkumpul;
  const totalPersen = totalTarget > 0 ? (totalTerkumpul / totalTarget) * 100 : 0;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2 inline-block">
            Anda Login Sebagai {userRole}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            {timeGreeting}, {userName}
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant font-semibold mt-1 leading-relaxed">
            Assalamu'alaikum. Selamat datang di portal {siteName}.
            <br />
            Semoga segala pencatatan bernilai ibadah.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/pemasukan?type=in" className="primary-gradient text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md shadow-primary/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
            <Icon name="add" className="text-sm font-bold" />
            Kas Masuk (Pemasukan)
          </Link>
          <Link href="/dashboard/pemasukan?type=out" className="bg-white border border-error/20 text-error px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-error/5 active:scale-[0.98] transition-all cursor-pointer">
            <Icon name="remove" className="text-sm font-bold" />
            Kas Keluar (Pengeluaran)
          </Link>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-primary/10 gap-6">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === 'ringkasan' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          Ringkasan Kas &amp; Transaksi
        </button>
        <button
          onClick={() => setActiveTab('bi')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bi' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <Icon name="insights" className="text-base" />
          Rencana Kegiatan &amp; Analisis BI
        </button>
      </div>

      {/* TAB 1: RINGKASAN KAS */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Stats Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="glass-card p-4 rounded-2xl shadow-sm border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase">Saldo Kas Utama</span>
                <Icon name="account_balance_wallet" className="text-primary text-lg" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-primary">Rp</span>
                <span className="text-xl font-extrabold text-on-surface tracking-tight">
                  {new Intl.NumberFormat('id-ID').format(stats.saldoUtama)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-primary font-bold flex items-center gap-1">
                <Icon name="verified_user" className="text-xs font-bold" /> Terverifikasi secara realtime
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl shadow-sm border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase">Pemasukan Hari Ini</span>
                <Icon name="arrow_circle_down" className="text-primary text-lg" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-primary">Rp</span>
                <span className="text-xl font-extrabold text-on-surface tracking-tight">
                  {new Intl.NumberFormat('id-ID').format(stats.pemasukanHariIni)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-on-surface-variant font-semibold">Tercatat per hari ini</div>
            </div>

            <div className="glass-card p-4 rounded-2xl shadow-sm border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase">Pengeluaran Hari Ini</span>
                <Icon name="arrow_circle_up" className="text-error text-lg" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold text-error">Rp</span>
                <span className="text-xl font-extrabold text-on-surface tracking-tight">
                  {new Intl.NumberFormat('id-ID').format(stats.pengeluaranHariIni)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-on-surface-variant font-semibold">Tercatat per hari ini</div>
            </div>

            <div className="glass-card p-4 rounded-2xl shadow-sm border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase">Total Santri Aktif</span>
                <Icon name="group" className="text-primary text-lg" />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-extrabold text-on-surface tracking-tight">
                  {stats.totalSantri}
                </span>
                <span className="text-xs text-on-surface-variant font-bold ml-1">Anak</span>
              </div>
              <div className="mt-2 text-[10px] text-on-surface-variant font-semibold">100% terdata aktif</div>
            </div>
          </div>

          {/* Table & Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden shadow-sm border border-white/20">
              <div className="p-4 px-6 border-b border-white/20 flex justify-between items-center bg-white/20">
                <h3 className="font-bold text-sm text-on-surface">Pencatatan Transaksi Terbaru (Internal)</h3>
                <Link href="/dashboard/laporan" className="text-[10px] font-bold text-primary hover:underline">Lihat Semua</Link>
              </div>
              <div className="divide-y divide-white/10">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((trx) => (
                    <div key={trx.id} className="p-4 px-6 flex justify-between items-center hover:bg-primary/5 transition-colors duration-150">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-on-surface-variant">
                            {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            trx.tipe === 'in' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'
                          }`}>{trx.kategori}</span>
                        </div>
                        <h4 className="text-xs font-bold text-on-surface leading-tight truncate max-w-[240px] md:max-w-[320px]">
                          {trx.keterangan || 'Catatan transaksi kas'}
                        </h4>
                      </div>
                      <div className={`text-xs font-bold ${trx.tipe === 'in' ? 'text-primary' : 'text-error'}`}>
                        {trx.tipe === 'in' ? '+' : '-'}Rp {new Intl.NumberFormat('id-ID').format(trx.nominal)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs font-semibold text-on-surface-variant">
                    Belum ada pencatatan transaksi kas.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-3xl shadow-sm border border-white/20 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <Icon name="gavel" className="text-primary text-lg" />
                  Prinsip Pencatatan (Syariah)
                </h3>
                <div className="space-y-3 text-xs text-on-surface-variant font-semibold leading-relaxed">
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <p><strong className="text-on-surface">Amanah:</strong> Catat setiap rupiah sesuai transaksi riil tanpa ada manipulasi atau pembulatan sepihak.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <p><strong className="text-on-surface">Tepat Waktu:</strong> Hindari menunda pencatatan untuk meminimalisir risiko lupa atau kehilangan kuitansi.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <p><strong className="text-on-surface">Transparan:</strong> Seluruh laporan internal dan publik dapat dipertanggungjawabkan kapan saja.</p>
                  </div>
                </div>
              </div>

              <div className="primary-gradient p-6 rounded-3xl text-white shadow-lg shadow-primary/20 space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z\' fill=\'%23ffffff\'/%3E%3C/svg%3E')", backgroundSize: '40px 40px' }}></div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-bold text-sm">Butuh Bantuan Teknis?</h3>
                  <p className="text-xs text-on-primary-container/80 leading-relaxed font-semibold">
                    Jika ada kendala sistem, salah ketik nominal pasca tutup buku, atau ingin reset akun pengurus, hubungi Admin Utama.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS INTELLIGENCE DASHBOARD */}
      {activeTab === 'bi' && (
        <div className="space-y-8 animate-fade-in-up text-left">
          {/* BI Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl shadow-sm border border-white/20 bg-primary/5">
              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Target Anggaran Program</h4>
              <p className="text-2xl font-extrabold text-on-surface">{formatRupiah(totalTarget)}</p>
              <p className="text-[10px] text-on-surface-variant font-semibold mt-1">Akumulasi seluruh program aktif yayasan</p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-sm border border-white/20 bg-secondary-container/10">
              <h4 className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-2">Dana Terkumpul</h4>
              <p className="text-2xl font-extrabold text-secondary">{formatRupiah(totalTerkumpul)}</p>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${totalPersen}%` }}></div>
              </div>
              <p className="text-[9px] text-on-surface-variant font-semibold mt-1">Pencapaian: {totalPersen.toFixed(1)}%</p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-sm border border-white/20 bg-error-container/10">
              <h4 className="text-[10px] text-error font-bold uppercase tracking-wider mb-2">Defisit Dana (Kekurangan)</h4>
              <p className="text-2xl font-extrabold text-error">{formatRupiah(totalDefisit)}</p>
              <p className="text-[10px] text-on-surface-variant font-semibold mt-1">Sisa kebutuhan dana untuk dicapai</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Program & Progress Bars */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-6">
              <h3 className="font-bold text-sm text-on-surface">Target Pendanaan &amp; Progress Program</h3>
              
              <div className="space-y-6">
                {kegiatanList.map((k) => {
                  const pct = (k.terkumpul / k.target) * 100;
                  const sisa = k.target - k.terkumpul;
                  return (
                    <div key={k.id} className="p-4 rounded-2xl bg-white border border-primary/10 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">{k.name}</h4>
                          <p className="text-[9px] text-primary font-bold">Sumber: {k.sumber}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          pct >= 100 ? 'bg-primary/25 text-primary' : 'bg-tertiary-container text-on-tertiary-container'
                        }`}>
                          {pct >= 100 ? 'Selesai / Terpenuhi' : `Sisa ${formatRupiah(sisa)}`}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-on-surface-variant">{formatRupiah(k.terkumpul)} terkumpul</span>
                          <span className="text-primary">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="primary-gradient h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-[9px] text-on-surface-variant font-semibold">
                        <span>Target: {formatRupiah(k.target)}</span>
                        <span>Tenggat: {k.tenggat}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Simulasi BI & AI Insights */}
            <div className="space-y-6">
              {/* Simulator */}
              <div className="glass-card p-6 rounded-3xl shadow-sm border border-white/20 space-y-4">
                <h3 className="font-bold text-xs text-on-surface flex items-center gap-2 uppercase tracking-wider">
                  <Icon name="tune" className="text-primary text-base" />
                  Kalkulator Simulasi BI
                </h3>
                <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed">
                  Gunakan panel ini untuk mensimulasikan penyaluran surplus Kas Utama ke program kegiatan yang mengalami defisit.
                </p>

                <form onSubmit={handleSimulateAllocation} className="space-y-3 pt-2">
                  <FormField label="Pilih Program Kegiatan">
                    <Select
                      options={kegiatanList.map((k) => ({ value: k.id, label: k.name }))}
                      value={selectedKegiatanId}
                      onChange={setSelectedKegiatanId}
                    />
                  </FormField>
                  <FormField label="Nominal Alokasi Simulasi (Rp)">
                    <Input
                      type="text"
                      required
                      placeholder="Masukkan nominal angka saja..."
                      value={simulationAmount}
                      onChange={(e) => setSimulationAmount(e.target.value)}
                    />
                  </FormField>
                  <Button type="submit" variant="primary" className="w-full py-2.5" leftIcon="payments">
                    Alokasikan Dana
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleResetSimulation} 
                    className="w-full py-2.5 border-none"
                    leftIcon="restart_alt"
                  >
                    Reset Simulasi
                  </Button>
                </form>
              </div>

              {/* BI AI Insights */}
              <div className="glass-card p-6 rounded-3xl shadow-sm border border-white/20 space-y-3 bg-tertiary-container/5">
                <h3 className="font-bold text-xs text-primary flex items-center gap-2 uppercase tracking-wider select-none">
                  <Icon name="auto_awesome" className="text-primary text-base" fill={true} />
                  Rekomendasi &bull; Asisten BI
                </h3>
                
                <div className="space-y-3 text-[11px] text-on-surface-variant font-semibold leading-relaxed">
                  {totalPersen >= 100 ? (
                    <p className="text-primary bg-primary/5 p-3 rounded-xl border border-primary/10">
                      ✓ <strong className="text-primary">Selamat!</strong> Akumulasi dana seluruh kegiatan program Al-Furqon telah terpenuhi sepenuhnya. Rencana kegiatan siap dieksekusi.
                    </p>
                  ) : kegiatanList.length === 0 ? (
                    <p className="text-on-surface-variant bg-surface-container-high/40 p-3 rounded-xl border border-primary/5 text-center">
                      Belum ada data program kegiatan untuk dianalisis oleh Asisten BI. Silakan tambahkan rencana kegiatan baru.
                    </p>
                  ) : (
                    <>
                      {kegiatanList.length > 0 && (
                        <div className="p-3 bg-white rounded-xl border border-primary/10 space-y-1">
                          <p className="text-on-surface font-bold flex items-center gap-1">
                            <Icon name="schedule" className="text-xs text-primary font-bold" /> Proyeksi {kegiatanList[0].name}
                          </p>
                          <p>
                            Berdasarkan simulasi alokasi kas, program <strong className="text-on-surface">{kegiatanList[0].name}</strong> diperkirakan akan berjalan lancar dengan pemantauan realtime.
                          </p>
                        </div>
                      )}

                      {kegiatanList.length > 1 && (
                        <div className="p-3 bg-white rounded-xl border border-primary/10 space-y-1">
                          <p className="text-on-surface font-bold flex items-center gap-1">
                            <Icon name="warning" className="text-xs text-error font-bold" /> Deviasi Dana {kegiatanList[1].name}
                          </p>
                          <p>
                            Program {kegiatanList[1].name} mengalami defisit {(((kegiatanList[1].target - kegiatanList[1].terkumpul) / kegiatanList[1].target) * 100).toFixed(0)}%.
                            <strong className="text-primary"> Rekomendasi BI</strong>: Alokasikan surplus kas utama ke program ini untuk mempercepat penyelesaian target.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

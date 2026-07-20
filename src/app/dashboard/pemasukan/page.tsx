'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import SmartCurrencyInput from '@/components/molecules/SmartCurrencyInput';
import ImagePicker from '@/components/molecules/ImagePicker';
import Toast from '@/components/molecules/Toast';
import DatePicker from '@/components/molecules/DatePicker';
import CollapsibleGuide from '@/components/molecules/CollapsibleGuide';
import PageHeader from '@/components/molecules/PageHeader';

interface SantriMock {
  name: string;
  wali: string;
}

function CashflowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMode = searchParams.get('type') === 'out' ? 'out' : 'in';
  const [mode, setMode] = useState<'in' | 'out'>(initialMode);

  // Shared state
  const [kategori, setKategori] = useState('');
  const [tanggal, setTanggal] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Kas Masuk specific
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriMock | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [manualAsalDana, setManualAsalDana] = useState('');

  // Kas Keluar specific
  const [penerima, setPenerima] = useState('');
  const [penerimaSuggestions, setPenerimaSuggestions] = useState<string[]>([]);
  const [showPenerimaSuggestions, setShowPenerimaSuggestions] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const penerimaContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [kategoriOptions, setKategoriOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    setKategori('');
    fetch('/api/categories')
      .then(res => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const filtered = (data as { tipe: string; name: string }[])
            .filter(c => c.tipe === mode)
            .map(c => ({ value: c.name, label: c.name }));
          setKategoriOptions(filtered);
        } else throw new Error();
      })
      .catch(() => {
        setKategoriOptions(
          mode === 'in'
            ? [
                { value: 'Iuran Wali', label: 'Iuran Wali Santri (Bulanan)' },
                { value: 'Tabungan', label: 'Tabungan Santri' },
                { value: 'Hibah', label: 'Hibah / Waqaf Kelembagaan' },
                { value: 'Lainnya', label: 'Lain-lain' },
              ]
            : [
                { value: 'Operasional', label: 'Operasional Kantor / Asrama' },
                { value: 'Logistik', label: 'Konsumsi & Logistik Santri' },
                { value: 'Pendidikan', label: 'Biaya Pendidikan / Kitab' },
                { value: 'Lainnya', label: 'Lain-lain' },
              ]
        );
      });
    if (mode === 'out') {
      fetch('/api/transaksi/penerima')
        .then(res => res.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) {
            setPenerimaSuggestions(data as string[]);
          }
        })
        .catch(() => {});
    }
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (penerimaContainerRef.current && !penerimaContainerRef.current.contains(event.target as Node)) {
        setShowPenerimaSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModeSwitch = (newMode: 'in' | 'out') => {
    setMode(newMode);
    // Reset all form fields when switching
    setKategori('');
    setNominal('');
    setKeterangan('');
    setSearchQuery('');
    setSelectedSantri(null);
    setManualAsalDana('');
    setPenerima('');
    setReceiptImage(null);
    router.replace(`/dashboard/pemasukan?type=${newMode}`, { scroll: false });
  };

  const mockSantriList: SantriMock[] = [
    { name: 'Muhammad Ali', wali: 'Bpk. Hasan' },
    { name: 'Aisyah Putri', wali: 'Ibu Fatimah' },
    { name: 'Ahmad Rafli', wali: 'Bpk. Ridwan' },
    { name: 'Khadijah Az-Zahra', wali: 'Bpk. Lukman' },
    { name: "Fatih Nur Rahman", wali: "Bpk. Nu'man" },
  ];

  const filteredSantri = mockSantriList.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.wali.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || !nominal) {
      setToastMessage('Kategori dan Nominal wajib diisi!');
      setToastType('error');
      setShowToast(true);
      return;
    }
    setIsLoading(true);

    const cleanNominal = parseInt(nominal.replace(/[^0-9]/g, ''), 10);
    let ketText = '';
    if (mode === 'in') {
      ketText = selectedSantri
        ? `Wali: ${selectedSantri.wali} (Santri: ${selectedSantri.name}) - ${keterangan}`
        : manualAsalDana
        ? `Sumber: ${manualAsalDana} - ${keterangan}`
        : keterangan || 'Kas masuk';
    } else {
      ketText = penerima
        ? `Penerima: ${penerima} - ${keterangan}`
        : keterangan || 'Pengeluaran kas';
    }

    fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kategori,
        nominal: cleanNominal,
        keterangan: ketText,
        tanggal,
        tipe: mode,
        receiptImage: mode === 'out' ? (receiptImage || null) : null,
      }),
    })
      .then(res => res.json())
      .then((raw: unknown) => {
        const data = raw as { success?: boolean; error?: string };
        setIsLoading(false);
        if (data.success) {
          setToastMessage(`Transaksi ${mode === 'in' ? 'pemasukan' : 'pengeluaran'} berhasil disimpan!`);
          setToastType('success');
          setShowToast(true);
          setKategori(''); setNominal(''); setKeterangan('');
          setSearchQuery(''); setSelectedSantri(null); setManualAsalDana('');
          setPenerima(''); setReceiptImage(null);
        } else throw new Error(data.error);
      })
      .catch((err: Error) => {
        setIsLoading(false);
        setToastMessage(err.message || 'Gagal menyimpan transaksi.');
        setToastType('error');
        setShowToast(true);
      });
  };

  const showSantriSearch = mode === 'in' && (kategori === 'Iuran Wali' || kategori === 'Tabungan');
  const showManualAsalDana = mode === 'in' && (kategori === 'Hibah' || kategori === 'Waqaf' || kategori === 'Lainnya');

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      {/* Header */}
      <PageHeader
        path="/dashboard/pemasukan"
        defaultBadge="Arus Kas"
        defaultTitle="Form Pencatatan Kas"
        defaultDesc="Pencatatan kas masuk dan kas keluar secara instan, transparan, dan profesional."
      />

      {/* Single Card with Tab inside */}
      <div className="glass-card rounded-3xl shadow-sm border border-white/20 overflow-hidden">

        {/* ── Tab Bar (Kas Masuk | Kas Keluar) ── */}
        <div className="flex border-b border-outline/10 select-none">
          <button
            type="button"
            onClick={() => handleModeSwitch('in')}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              mode === 'in'
                ? 'border-primary text-primary bg-primary/5 font-extrabold'
                : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${mode === 'in' ? 'bg-primary' : 'bg-outline/40'}`} />
            <Icon name="arrow_circle_down" className="text-base" />
            Kas Masuk
          </button>

          <div className="w-px bg-outline/10 my-2" />

          <button
            type="button"
            onClick={() => handleModeSwitch('out')}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              mode === 'out'
                ? 'border-error text-error bg-error-container/30 font-extrabold'
                : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${mode === 'out' ? 'bg-error' : 'bg-outline/40'}`} />
            <Icon name="arrow_circle_up" className="text-base" />
            Kas Keluar
          </button>
        </div>

        {/* ── Context Banner (type indicator) ── */}
        <div className={`px-6 py-3 flex items-center gap-3 text-[11px] font-semibold transition-colors ${
          mode === 'in'
            ? 'bg-primary/5 text-primary/70'
            : 'bg-error-container/20 text-on-error-container/80'
        }`}>
          <Icon name={mode === 'in' ? 'info' : 'warning_amber'} className="text-base flex-shrink-0" />
          {mode === 'in'
            ? 'Anda sedang mencatat pemasukan kas. Semua transaksi langsung tersinkronisasi ke Buku Besar Publik.'
            : 'Anda sedang mencatat pengeluaran kas. Disarankan mengunggah bukti nota/kuitansi untuk keperluan audit.'}
        </div>

        {/* ── Form Fields ── */}
        <form className="p-6 space-y-5 text-left" onSubmit={handleSubmit}>

          {/* Kategori */}
          <FormField label={`Kategori ${mode === 'in' ? 'Pemasukan' : 'Pengeluaran'}`}>
            <Select
              options={kategoriOptions}
              value={kategori}
              onChange={val => { setKategori(val); setSelectedSantri(null); setSearchQuery(''); }}
              placeholder={`-- Pilih Kategori ${mode === 'in' ? 'Pemasukan' : 'Pengeluaran'} --`}
              disabled={isLoading}
            />
          </FormField>

          {/* Tabungan warning */}
          {mode === 'in' && kategori === 'Tabungan' && (
            <div className="p-4 bg-tertiary-container/10 border border-tertiary/20 rounded-2xl flex gap-3 animate-fade-in-up">
              <Icon name="info" className="text-tertiary text-lg flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-semibold text-on-tertiary-fixed-variant">
                Untuk mencatat tabungan pribadi santri agar masuk ke saldo wadiah otomatis, gunakan menu{' '}
                <Link href="/dashboard/tabungan" className="text-primary font-extrabold hover:underline">
                  Buku Tabungan Santri
                </Link>{' '}
                (tombol <strong>Setor</strong>). Form ini hanya untuk iuran wajib, infaq, dan hibah umum.
              </p>
            </div>
          )}

          {/* Tanggal */}
          <FormField label="Tanggal Transaksi">
            <DatePicker value={tanggal} onChange={setTanggal} disabled={isLoading} />
          </FormField>

          {/* [Kas Masuk] Santri Search */}
          {showSantriSearch && (
            <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-fade-in-up">
              <label className="text-xs font-bold text-primary ml-1" htmlFor="santri-search">
                Cari Nama Santri / Wali
              </label>
              <div className="relative">
                <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-lg" />
                <input
                  id="santri-search"
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-primary/10 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-xs font-semibold text-on-surface"
                  placeholder="Ketik nama santri atau wali..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  disabled={isLoading}
                />
                {showSearchResults && searchQuery && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-primary/10 max-h-48 overflow-y-auto z-50 no-scrollbar">
                    {filteredSantri.length > 0 ? (
                      filteredSantri.map((s, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-xs border-b border-primary/5 last:border-0 flex justify-between items-center"
                          onClick={() => { setSelectedSantri(s); setSearchQuery(`${s.wali} (${s.name})`); setShowSearchResults(false); }}
                        >
                          <div>
                            <p className="font-bold text-on-surface">{s.name}</p>
                            <p className="text-[10px] text-on-surface-variant">Wali: {s.wali}</p>
                          </div>
                          <Icon name="check_circle" className="text-primary text-base" />
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-on-surface-variant">Tidak ada santri ditemukan</div>
                    )}
                  </div>
                )}
              </div>
              {selectedSantri && (
                <div className="flex justify-between items-center bg-white p-2.5 px-4 rounded-xl border border-primary/20 text-xs">
                  <span className="font-bold text-primary">✓ {selectedSantri.name} ({selectedSantri.wali})</span>
                  <button type="button" className="text-error font-bold hover:underline text-[10px]"
                    onClick={() => { setSelectedSantri(null); setSearchQuery(''); }}>
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* [Kas Masuk] Sumber Dana */}
          {showManualAsalDana && (
            <FormField label="Sumber / Asal Dana">
              <Input
                type="text"
                placeholder="Contoh: H. Abdullah / PT. Mulia Bersama"
                value={manualAsalDana}
                onChange={e => setManualAsalDana(e.target.value)}
                disabled={isLoading}
              />
            </FormField>
          )}

          {/* [Kas Keluar] Penerima Dana */}
          {mode === 'out' && (
            <FormField label="Penerima Dana / Pihak Ketiga">
              <div ref={penerimaContainerRef} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Contoh: Toko Kitab Al-Azhar / PLN / Ustadz Hasan"
                  value={penerima}
                  onChange={e => {
                    setPenerima(e.target.value);
                    setShowPenerimaSuggestions(true);
                  }}
                  onFocus={() => setShowPenerimaSuggestions(true)}
                  disabled={isLoading}
                />
                {showPenerimaSuggestions && penerima && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-primary/10 max-h-48 overflow-y-auto z-[999] no-scrollbar">
                    {penerimaSuggestions.filter(s => s.toLowerCase().includes(penerima.toLowerCase())).length > 0 ? (
                      penerimaSuggestions
                        .filter(s => s.toLowerCase().includes(penerima.toLowerCase()))
                        .map((s, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-xs border-b border-primary/5 last:border-0 flex justify-between items-center text-left"
                            onClick={() => {
                              setPenerima(s);
                              setShowPenerimaSuggestions(false);
                            }}
                          >
                            <span className="font-bold text-on-surface">{s}</span>
                            <span className="flex items-center gap-1 text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-extrabold uppercase">
                              <Icon name="history" className="text-[10px]" /> Tersimpan
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-on-surface-variant italic text-left">
                        Penerima baru (akan disimpan otomatis)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FormField>
          )}

          {/* Nominal */}
          <FormField label={`Nominal ${mode === 'in' ? 'Pemasukan' : 'Pengeluaran'} (Rp)`}>
            <SmartCurrencyInput
              id="nominal"
              value={nominal}
              onChange={setNominal}
              disabled={isLoading}
              placeholder="Masukkan nominal angka saja..."
            />
          </FormField>

          {/* Keterangan */}
          <FormField label="Keterangan / Catatan Transaksi">
            <textarea
              id="keterangan"
              rows={3}
              className="w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:bg-white transition-all text-xs font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
              placeholder={mode === 'in' ? 'Tulis rincian atau keterangan tambahan...' : 'Tulis alasan pengeluaran kas secara lengkap...'}
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              disabled={isLoading}
            />
          </FormField>

          {/* [Kas Keluar] Upload Kuitansi */}
          {mode === 'out' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">
                Bukti Pembayaran / Kuitansi (Opsional)
              </label>
              <ImagePicker value={receiptImage} onChange={setReceiptImage} disabled={isLoading} />
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-outline/10 pt-2" />

          {/* Submit */}
          <Button
            type="submit"
            variant={mode === 'in' ? 'primary' : 'error'}
            isLoading={isLoading}
            className="w-full py-4 cursor-pointer"
            rightIcon={!isLoading ? 'save' : undefined}
          >
            {mode === 'in' ? '💾  Simpan Pemasukan Kas' : '💾  Simpan Pengeluaran Kas'}
          </Button>
        </form>
      </div>

      {/* Panduan collapsible di bawah */}
      <CollapsibleGuide title="Panduan & Status Pencatatan" icon="help_outline" defaultOpen={false}>
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <p className="text-xs font-bold text-primary">Database Utama Tersinkronisasi</p>
          </div>
          <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
            Setiap pencatatan kas masuk maupun kas keluar akan langsung ter-sinkronisasi ke Buku Besar Publik dan Laporan Keuangan secara real-time.
          </p>
          <div className="space-y-2 border-t border-primary/10 pt-4">
            <h4 className="font-bold text-xs text-tertiary flex items-center gap-1.5">
              <Icon name="tips_and_updates" className="text-base" />
              Tips Pencatatan Kas
            </h4>
            <ul className="text-[11px] text-on-surface-variant space-y-2 font-semibold">
              <li>&bull; Pilih tab <strong>Kas Masuk</strong> atau <strong>Kas Keluar</strong> sesuai jenis transaksi.</li>
              <li>&bull; Cukup ketik angka di kolom nominal — terbilang muncul otomatis.</li>
              <li>&bull; Untuk pengeluaran, sertakan foto kuitansi/nota sebagai bukti audit.</li>
            </ul>
          </div>
        </div>
      </CollapsibleGuide>
    </div>
  );
}

export default function CashflowPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 text-xs font-bold text-on-surface-variant">
        Memuat Form Arus Kas...
      </div>
    }>
      <CashflowContent />
    </Suspense>
  );
}

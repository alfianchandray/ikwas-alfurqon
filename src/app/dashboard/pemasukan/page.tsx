'use client';

import React, { useState, useEffect, Suspense } from 'react';
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

  // Mode: 'in' (Pemasukan) | 'out' (Pengeluaran)
  const initialMode = searchParams.get('type') === 'out' ? 'out' : 'in';
  const [mode, setMode] = useState<'in' | 'out'>(initialMode);

  const [kategori, setKategori] = useState('');
  const [tanggal, setTanggal] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Mode IN specific states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriMock | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [manualAsalDana, setManualAsalDana] = useState('');

  // Mode OUT specific states
  const [penerima, setPenerima] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [kategoriOptions, setKategoriOptions] = useState<{ value: string; label: string }[]>([]);

  // Load dynamic categories based on mode ('in' or 'out')
  useEffect(() => {
    setKategori('');
    fetch('/api/categories')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          const filtered = data
            .filter((c: any) => c.tipe === mode)
            .map((c: any) => ({ value: c.name, label: c.name }));
          setKategoriOptions(filtered);
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        // Fallback
        if (mode === 'in') {
          setKategoriOptions([
            { value: 'Iuran Wali', label: 'Iuran Wali Santri (Bulanan)' },
            { value: 'Tabungan', label: 'Tabungan Santri' },
            { value: 'Hibah', label: 'Hibah / Waqaf Kelembagaan' },
            { value: 'Lainnya', label: 'Lain-lain' },
          ]);
        } else {
          setKategoriOptions([
            { value: 'Operasional', label: 'Operasional Kantor / Asrama' },
            { value: 'Logistik', label: 'Konsumsi & Logistik Santri' },
            { value: 'Pendidikan', label: 'Biaya Pendidikan / Kitab' },
            { value: 'Lainnya', label: 'Lain-lain' },
          ]);
        }
      });
  }, [mode]);

  const handleModeSwitch = (newMode: 'in' | 'out') => {
    setMode(newMode);
    setKategori('');
    setNominal('');
    setKeterangan('');
    setSearchQuery('');
    setSelectedSantri(null);
    setManualAsalDana('');
    setPenerima('');
    setReceiptImage(null);
    router.replace(`/dashboard/pemasukan?type=${newMode}`);
  };

  const mockSantriList: SantriMock[] = [
    { name: 'Muhammad Ali', wali: 'Bpk. Hasan' },
    { name: 'Aisyah Putri', wali: 'Ibu Fatimah' },
    { name: 'Ahmad Rafli', wali: 'Bpk. Ridwan' },
    { name: 'Khadijah Az-Zahra', wali: 'Bpk. Lukman' },
    { name: 'Fatih Nur Rahman', wali: 'Bpk. Nu\'man' },
  ];

  const filteredSantri = mockSantriList.filter(
    (s) =>
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
    const cleanNominal = parseInt(nominal.replace(/[^0-9]/g, ""), 10);

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
        : keterangan || 'Catatan pengeluaran kas';
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
    .then((res) => res.json())
    .then((data: any) => {
      setIsLoading(false);
      if (data.success) {
        setToastMessage(`Transaksi ${mode === 'in' ? 'pemasukan' : 'pengeluaran'} berhasil disimpan!`);
        setToastType('success');
        setShowToast(true);

        // Reset form states
        setKategori('');
        setNominal('');
        setKeterangan('');
        setSearchQuery('');
        setSelectedSantri(null);
        setManualAsalDana('');
        setPenerima('');
        setReceiptImage(null);
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setIsLoading(false);
      setToastMessage(err.message || 'Gagal menyimpan transaksi.');
      setToastType('error');
      setShowToast(true);
    });
  };

  const showSantriSearch = mode === 'in' && (kategori === 'Iuran Wali' || kategori === 'Tabungan');
  const showManualAsalDana = mode === 'in' && (kategori === 'Hibah' || kategori === 'Waqaf' || kategori === 'Lainnya');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <PageHeader
        path="/dashboard/pemasukan"
        defaultBadge="Arus Kas"
        defaultTitle="Form Pencatatan Kas"
        defaultDesc="Pencatatan kas masuk dan kas keluar secara instan, transparan, dan profesional."
      />

      {/* Segmented Mode Switcher (Kas Masuk vs Kas Keluar) */}
      <div className="flex p-1.5 bg-surface-container-high/60 backdrop-blur-md rounded-2xl border border-primary/10 max-w-md mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => handleModeSwitch('in')}
          className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
            mode === 'in'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Icon name="arrow_circle_down" className="text-base" />
          🟢 Kas Masuk (Pemasukan)
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('out')}
          className={`flex-1 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
            mode === 'out'
              ? 'bg-error text-white shadow-md shadow-error/20 scale-[1.02]'
              : 'text-on-surface-variant hover:text-error'
          }`}
        >
          <Icon name="arrow_circle_up" className="text-base" />
          🔴 Kas Keluar (Pengeluaran)
        </button>
      </div>

      {/* Panduan Spoiler */}
      <CollapsibleGuide title="Panduan & Status Pencatatan" icon="help_outline" defaultOpen={false}>
        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <p className="text-xs font-bold text-primary">Database Utama Tersinkronisasi</p>
            </div>
            <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
              Setiap pencatatan kas masuk maupun kas keluar akan langsung ter-sinkronisasi ke Buku Besar Publik dan Laporan Keuangan secara real-time.
            </p>
          </div>

          <div className="space-y-2 border-t border-primary/10 pt-4">
            <h4 className="font-bold text-xs text-tertiary flex items-center gap-1.5">
              <Icon name="tips_and_updates" className="text-base" />
              Petunjuk Pencatatan Kas
            </h4>
            <ul className="text-[11px] text-on-surface-variant space-y-2 font-semibold">
              <li>&bull; Pilih jenis transaksi menggunakan switch <strong>Kas Masuk</strong> atau <strong>Kas Keluar</strong> di atas.</li>
              <li>&bull; Cukup ketik angka tanpa titik di kolom nominal. Format Rupiah dan Terbilang akan otomatis muncul.</li>
              <li>&bull; Untuk Pengeluaran Kas, disarankan mengunggah foto kuitansi/nota sebagai bukti sah audit.</li>
            </ul>
          </div>
        </div>
      </CollapsibleGuide>

      {/* Centered Form Area */}
      <div className={`glass-card rounded-3xl p-6 md:p-8 shadow-sm border transition-all duration-300 max-w-2xl mx-auto ${
        mode === 'in' ? 'border-primary/20' : 'border-error/20'
      }`}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-primary/10">
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            mode === 'in' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'
          }`}>
            {mode === 'in' ? 'Mode Kas Masuk' : 'Mode Kas Keluar'}
          </span>
          <span className="text-xs font-semibold text-on-surface-variant">
            {mode === 'in' ? 'Pemasukan Kas Yayasan' : 'Pengeluaran Kas Operasional'}
          </span>
        </div>

        <form className="space-y-5 text-left" onSubmit={handleSubmit}>
          {/* Kategori Transaksi */}
          <FormField label={`Kategori ${mode === 'in' ? 'Pemasukan' : 'Pengeluaran'}`}>
            <Select
              options={kategoriOptions}
              value={kategori}
              onChange={(val) => {
                setKategori(val);
                setSelectedSantri(null);
                setSearchQuery('');
              }}
              placeholder={`-- Pilih Kategori ${mode === 'in' ? 'Pemasukan' : 'Pengeluaran'} --`}
              disabled={isLoading}
            />
          </FormField>

          {mode === 'in' && kategori === 'Tabungan' && (
            <div className="p-4 bg-tertiary-container/10 border border-tertiary/20 rounded-2xl animate-fade-in-up flex gap-3 text-left">
              <Icon name="info" className="text-tertiary text-lg flex-shrink-0" />
              <p className="text-[11px] leading-relaxed font-bold text-on-tertiary-fixed-variant">
                ⚠️ <strong className="text-tertiary">Perhatian</strong>: Untuk mencatat tabungan pribadi santri agar terhitung ke saldo wadiah mereka secara otomatis, silakan menginputnya langsung melalui menu <Link href="/dashboard/tabungan" className="text-primary hover:underline font-extrabold">Buku Tabungan Santri</Link> (klik tombol **Setor**). Penginputan di form Pemasukan ini hanya ditujukan untuk iuran wajib, infaq, atau hibah umum.
              </p>
            </div>
          )}

          {/* Tanggal Transaksi */}
          <FormField label="Tanggal Transaksi">
            <DatePicker
              value={tanggal}
              onChange={setTanggal}
              disabled={isLoading}
            />
          </FormField>

          {/* Mode IN: Santri Search */}
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  disabled={isLoading}
                />

                {/* Dropdown search results */}
                {showSearchResults && searchQuery && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-primary/10 max-h-48 overflow-y-auto z-50 no-scrollbar">
                    {filteredSantri.length > 0 ? (
                      filteredSantri.map((s, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-xs border-b border-primary/5 flex justify-between items-center"
                          onClick={() => {
                            setSelectedSantri(s);
                            setSearchQuery(`${s.wali} (${s.name})`);
                            setShowSearchResults(false);
                          }}
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
                <div className="flex justify-between items-center bg-white p-2 px-3 rounded-xl border border-primary/20 text-xs">
                  <span className="font-bold text-primary">Santri Terpilih: {selectedSantri.name} ({selectedSantri.wali})</span>
                  <button
                    type="button"
                    className="text-error text-xs font-bold hover:underline"
                    onClick={() => {
                      setSelectedSantri(null);
                      setSearchQuery('');
                    }}
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode IN: Manual Asal Dana */}
          {showManualAsalDana && (
            <FormField label="Sumber / Asal Dana">
              <Input
                type="text"
                placeholder="Contoh: H. Abdullah (Hamba Allah) / PT. Mulia Bersama"
                value={manualAsalDana}
                onChange={(e) => setManualAsalDana(e.target.value)}
                disabled={isLoading}
              />
            </FormField>
          )}

          {/* Mode OUT: Penerima Dana */}
          {mode === 'out' && (
            <FormField label="Penerima Dana / Pihak Ketiga">
              <Input
                type="text"
                placeholder="Contoh: Toko Kitab Al-Azhar / PLN / Ustadz Hasan"
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                disabled={isLoading}
              />
            </FormField>
          )}

          {/* Nominal (Smart Currency) */}
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
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isLoading}
            ></textarea>
          </FormField>

          {/* Mode OUT: Upload Kuitansi */}
          {mode === 'out' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">
                Bukti Pembayaran / Kuitansi (Opsional)
              </label>
              <ImagePicker
                value={receiptImage}
                onChange={setReceiptImage}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant={mode === 'in' ? 'primary' : 'error'}
            isLoading={isLoading}
            className="w-full py-4 mt-6 cursor-pointer"
            rightIcon={!isLoading ? 'save' : undefined}
          >
            {mode === 'in' ? 'Simpan Transaksi Pemasukan' : 'Simpan Transaksi Pengeluaran'}
          </Button>
        </form>
      </div>
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

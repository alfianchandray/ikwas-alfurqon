'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import SmartCurrencyInput from '@/components/molecules/SmartCurrencyInput';
import Toast from '@/components/molecules/Toast';
import DatePicker from '@/components/molecules/DatePicker';
import CollapsibleGuide from '@/components/molecules/CollapsibleGuide';
import PageHeader from '@/components/molecules/PageHeader';

interface SantriMock {
  name: string;
  wali: string;
}

export default function PemasukanPage() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriMock | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [manualAsalDana, setManualAsalDana] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [kategoriOptions, setKategoriOptions] = useState<{ value: string; label: string }[]>([]);

  // Load dynamic categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          const filtered = data
            .filter((c: any) => c.tipe === 'in')
            .map((c: any) => ({ value: c.name, label: c.name }));
          setKategoriOptions(filtered);
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        // Fallback
        setKategoriOptions([
          { value: 'Iuran Wali', label: 'Iuran Wali Santri (Bulanan)' },
          { value: 'Tabungan', label: 'Tabungan Santri' },
          { value: 'Hibah', label: 'Hibah / Waqaf Kelembagaan' },
          { value: 'Lainnya', label: 'Lain-lain' },
        ]);
      });
  }, []);

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
    const ketText = selectedSantri 
      ? `Wali: ${selectedSantri.wali} (Santri: ${selectedSantri.name}) - ${keterangan}`
      : `Sumber: ${manualAsalDana} - ${keterangan}`;

    fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kategori,
        nominal: cleanNominal,
        keterangan: ketText,
        tanggal,
        tipe: 'in',
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      setIsLoading(false);
      if (data.success) {
        setToastMessage('Transaksi pemasukan berhasil disimpan!');
        setToastType('success');
        setShowToast(true);

        // Reset form states
        setKategori('');
        setNominal('');
        setKeterangan('');
        setSearchQuery('');
        setSelectedSantri(null);
        setManualAsalDana('');
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

  const showSantriSearch = kategori === 'Iuran Wali' || kategori === 'Tabungan';
  const showManualAsalDana = kategori === 'Hibah' || kategori === 'Waqaf' || kategori === 'Lainnya';

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
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
        defaultBadge="Kas Masuk"
        defaultTitle="Form Pemasukan Pintar"
        defaultDesc="Pencatatan pemasukan kas secara otomatis mendeteksi relasi wali santri secara kondisional."
      />

      {/* Panduan Spoiler di Atas */}
      <CollapsibleGuide title="Panduan & Status Pencatatan" icon="help_outline" defaultOpen={false}>
        <div className="space-y-6 text-left">
          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <p className="text-xs font-bold text-primary">Database Utama Tersinkronisasi</p>
            </div>
            <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
              Setiap data pemasukan yang disimpan akan langsung ter-sinkronisasi ke Buku Besar Publik dan Laporan Keuangan secara real-time.
            </p>
          </div>

          {/* Tips */}
          <div className="space-y-2 border-t border-primary/10 pt-4">
            <h4 className="font-bold text-xs text-tertiary flex items-center gap-1.5">
              <Icon name="tips_and_updates" className="text-base" />
              Petunjuk Form Pemasukan
            </h4>
            <ul className="text-[11px] text-on-surface-variant space-y-2 font-semibold">
              <li>&bull; Pilih Kategori terlebih dahulu untuk memicu asisten input pintar.</li>
              <li>&bull; Cukup ketik angka tanpa titik atau koma di nominal input.</li>
              <li>&bull; Simpan berkas kuitansi cetak sebagai pelengkap laporan audit.</li>
            </ul>
          </div>
        </div>
      </CollapsibleGuide>

      {/* Centered Form Area */}
      <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 max-w-2xl mx-auto">
        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          {/* Kategori Pemasukan */}
          <FormField label="Kategori Pemasukan">
            <Select
              options={kategoriOptions}
              value={kategori}
              onChange={(val) => {
                setKategori(val);
                setSelectedSantri(null);
                setSearchQuery('');
              }}
              placeholder="-- Pilih Kategori Pemasukan --"
              disabled={isLoading}
            />
          </FormField>

          {kategori === 'Tabungan' && (
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

          {/* Conditional Section 1: Santri Search */}
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
                          className="p-3 hover:bg-primary/5 cursor-pointer border-b border-surface-container last:border-0 transition-colors flex justify-between items-center text-xs"
                          onClick={() => {
                            setSelectedSantri(s);
                            setSearchQuery(`${s.name} (Wali: ${s.wali})`);
                            setShowSearchResults(false);
                          }}
                        >
                          <div>
                            <p className="font-bold text-on-surface">{s.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-semibold">Wali: {s.wali}</p>
                          </div>
                          <Icon name="check_circle" className="text-primary text-base" fill={true} />
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-on-surface-variant font-semibold">
                        Santri/Wali tidak ditemukan.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedSantri && (
                <div className="mt-2 text-xs font-bold text-primary flex items-center gap-1.5 bg-white p-3 rounded-xl border border-primary/10 animate-fade-in-up">
                  <Icon name="person" className="text-base" />
                  Terpilih: {selectedSantri.name} &bull; Wali: {selectedSantri.wali}
                </div>
              )}
            </div>
          )}

          {/* Conditional Section 2: Manual Asal Dana */}
          {showManualAsalDana && (
            <div className="space-y-2 p-4 bg-tertiary-container/10 rounded-2xl border border-tertiary/10 animate-fade-in-up">
              <label className="text-xs font-bold text-tertiary ml-1" htmlFor="manual-asal">
                Nama Donatur / Asal Dana (Manual)
              </label>
              <Input
                id="manual-asal"
                type="text"
                placeholder="Masukkan nama pembayar atau asal instansi..."
                value={manualAsalDana}
                onChange={(e) => setManualAsalDana(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {/* Nominal (Smart Currency) */}
          <FormField label="Nominal Pemasukan">
            <SmartCurrencyInput
              id="nominal"
              value={nominal}
              onChange={setNominal}
              disabled={isLoading}
              placeholder="Masukkan nominal angka saja..."
            />
          </FormField>

          {/* Keterangan */}
          <FormField label="Keterangan Pemasukan">
            <textarea
              id="keterangan"
              rows={3}
              className="w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:bg-white transition-all text-xs font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
              placeholder="Tulis rincian atau keterangan tambahan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isLoading}
            ></textarea>
          </FormField>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full py-4"
            rightIcon={!isLoading ? 'save' : undefined}
          >
            Simpan Transaksi Pemasukan
          </Button>
        </form>
      </div>
    </div>
  );
}

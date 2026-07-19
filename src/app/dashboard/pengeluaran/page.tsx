'use client';

import React, { useState, useEffect } from 'react';
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

export default function PengeluaranPage() {
  const [kategori, setKategori] = useState('');
  const [tanggal, setTanggal] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [nominal, setNominal] = useState('');
  const [penerima, setPenerima] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

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
            .filter((c: any) => c.tipe === 'out')
            .map((c: any) => ({ value: c.name, label: c.name }));
          setKategoriOptions(filtered);
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        // Fallback
        setKategoriOptions([
          { value: 'Operasional', label: 'Operasional Kantor / Asrama' },
          { value: 'Logistik', label: 'Konsumsi & Logistik Santri' },
          { value: 'Pendidikan', label: 'Biaya Pendidikan / Kitab' },
          { value: 'Lainnya', label: 'Lain-lain' },
        ]);
      });
  }, []);

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

    fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kategori,
        nominal: cleanNominal,
        keterangan: `Penerima: ${penerima || 'Pihak Ketiga'} - ${keterangan || 'Catatan pengeluaran'}`,
        tanggal,
        tipe: 'out',
        receiptImage: receiptImage || null,
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      setIsLoading(false);
      if (data.success) {
        setToastMessage('Transaksi pengeluaran berhasil disimpan!');
        setToastType('success');
        setShowToast(true);

        // Reset form
        setKategori('');
        setNominal('');
        setPenerima('');
        setKeterangan('');
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
        path="/dashboard/pengeluaran"
        defaultBadge="Kas Keluar"
        defaultTitle="Form Pengeluaran Baru"
        defaultDesc="Pencatatan kas keluar secara profesional dilengkapi dengan manajemen unggah bukti bayar kuitansi."
      />

      {/* Panduan Spoiler di Atas */}
      <CollapsibleGuide title="Panduan & Kesesuaian Data" icon="help_outline" defaultOpen={false}>
        <div className="space-y-6 text-left">
          {/* Catatan Bendahara */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-on-surface">Catatan Bendahara</h4>
            <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed">
              Pengeluaran kas wajib dilaporkan dengan mengunggah foto kuitansi fisik sebagai bukti transaksi yang sah demi keterbukaan audit IKWAS.
            </p>
          </div>

          {/* Kesesuaian Data */}
          <div className="space-y-2 border-t border-primary/10 pt-4">
            <h4 className="font-bold text-xs text-tertiary flex items-center gap-1.5">
              <Icon name="tips_and_updates" className="text-base" />
              Kesesuaian Data
            </h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold">
              Pastikan nominal angka yang dimasukkan sesuai persis dengan nominal akhir yang tertulis pada kuitansi fisik yang diunggah.
            </p>
          </div>
        </div>
      </CollapsibleGuide>

      {/* Centered Form Area */}
      <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 max-w-2xl mx-auto">
        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          {/* Kategori Pengeluaran */}
          <FormField label="Kategori Pengeluaran">
            <Select
              options={kategoriOptions}
              value={kategori}
              onChange={(val) => setKategori(val)}
              placeholder="-- Pilih Kategori Pengeluaran --"
              disabled={isLoading}
            />
          </FormField>

          {/* Tanggal Transaksi */}
          <FormField label="Tanggal Transaksi">
            <DatePicker
              value={tanggal}
              onChange={setTanggal}
              disabled={isLoading}
            />
          </FormField>

          {/* Nominal (Smart Currency) */}
          <FormField label="Nominal Pengeluaran">
            <SmartCurrencyInput
              id="nominal"
              value={nominal}
              onChange={setNominal}
              disabled={isLoading}
              placeholder="Masukkan nominal angka saja..."
            />
          </FormField>

          {/* Penerima Dana / Pihak Kedua */}
          <FormField label="Penerima / Pihak Kedua">
            <Input
              id="penerima"
              type="text"
              placeholder="Contoh: Toko ATK Makmur, Ustadz Jafar..."
              value={penerima}
              onChange={(e) => setPenerima(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormField>

          {/* Keterangan */}
          <FormField label="Keterangan Pengeluaran">
            <textarea
              id="keterangan"
              rows={3}
              className="w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:bg-white transition-all text-xs font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
              placeholder="Tulis alasan pengeluaran kas secara lengkap..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isLoading}
            ></textarea>
          </FormField>

          {/* Upload Kuitansi Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">
              Bukti Pembayaran / Kuitansi
            </label>
            <ImagePicker
              value={receiptImage}
              onChange={setReceiptImage}
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="error"
            isLoading={isLoading}
            className="w-full py-4 mt-4 cursor-pointer"
            rightIcon={!isLoading ? 'save' : undefined}
          >
            Simpan Pengeluaran
          </Button>
        </form>
      </div>
    </div>
  );
}

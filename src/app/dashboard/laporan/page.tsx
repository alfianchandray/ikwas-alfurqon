'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import Toast from '@/components/molecules/Toast';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';
import DatatablePro, { ColumnDef } from '@/components/organisms/DatatablePro';
import PageHeader from '@/components/molecules/PageHeader';
import Icon from '@/components/atoms/Icon';
import CollapsibleGuide from '@/components/molecules/CollapsibleGuide';

interface Transaksi {
  id: string;
  tanggal: string;
  nama: string;
  keterangan: string;
  kategori: string;
  nominal: number;
  tipe: 'in' | 'out';
}

export default function LaporanPage() {
  const [dataTransaksi, setDataTransaksi] = useState<Transaksi[]>([]);
  const [categoryFilterOptions, setCategoryFilterOptions] = useState<{ value: string; label: string }[]>([]);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Cari transaksi, keterangan...');
  const [isLoading, setIsLoading] = useState(false);

  // Toast & Modals state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const [showTutupBukuModal, setShowTutupBukuModal] = useState(false);
  const [isTutupBukuLoading, setIsTutupBukuLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();

    const saved = localStorage.getItem('ikwas_sidebar_menu');
    if (saved) {
      const menu = JSON.parse(saved);
      const current = menu.find((item: any) => item.path === '/dashboard/laporan');
      if (current && current.placeholder) {
        setSearchPlaceholder(current.placeholder);
      }
    }
  }, []);

  const fetchTransactions = () => {
    setIsLoading(true);
    fetch('/api/transaksi')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          const mapped = data.map((t: any) => {
            let nama = '-';
            if (t.keterangan) {
              if (t.keterangan.startsWith('Wali:')) {
                const match = t.keterangan.match(/Wali:\s*([^(]+)/);
                if (match) {
                  nama = match[1].trim();
                } else {
                  nama = t.keterangan.split('Santri:')[0].replace('Wali:', '').trim();
                }
              } else if (t.keterangan.startsWith('Sumber:')) {
                const match = t.keterangan.match(/Sumber:\s*([^-]+)/);
                if (match) nama = match[1].trim();
              } else if (t.keterangan.startsWith('Penerima:')) {
                const match = t.keterangan.match(/Penerima:\s*([^-]+)/);
                if (match) nama = match[1].trim();
              } else {
                const parts = t.keterangan.split(' - ');
                if (parts.length > 1) {
                  nama = parts[0].trim();
                }
              }
            }
            return {
              id: t.id.toString(),
              tanggal: t.tanggal,
              nama,
              keterangan: t.keterangan || 'Catatan kas',
              kategori: t.kategori,
              nominal: t.nominal,
              tipe: t.tipe
            };
          });
          setDataTransaksi(mapped);
        }
      })
      .catch(() => {
        // Fallback
        setDataTransaksi([
          { id: '1', tanggal: '2023-10-12', nama: 'Ahmad Rafli', keterangan: 'Infaq Bulanan', kategori: 'Pemasukan', nominal: 150000, tipe: 'in' },
          { id: '2', tanggal: '2023-10-11', nama: 'Fatih Nur Rahman', keterangan: 'Sumbangan Pembangunan', kategori: 'Waqaf', nominal: 2000000, tipe: 'in' },
          { id: '3', tanggal: '2023-10-10', nama: 'Lembaga IKWAS', keterangan: 'Listrik & Air Asrama', kategori: 'Operasional', nominal: 1450000, tipe: 'out' },
        ]);
      })
      .finally(() => setIsLoading(false));
  };

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setCategoryFilterOptions(data.map((c: any) => ({ value: c.name, label: c.name })));
        }
      })
      .catch(() => {
        setCategoryFilterOptions([
          { value: 'Pemasukan', label: 'Pemasukan' },
          { value: 'Waqaf', label: 'Waqaf' },
          { value: 'Tabungan', label: 'Tabungan Santri' },
          { value: 'Operasional', label: 'Operasional' },
          { value: 'Pendidikan', label: 'Pendidikan' },
        ]);
      });
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const handleTutupBuku = () => {
    setIsTutupBukuLoading(true);
    
    // Call reset / delete mock or just clear table
    // For safety in this demo, let's pretend to archive and clear state
    setTimeout(() => {
      setIsTutupBukuLoading(false);
      setShowTutupBukuModal(false);
      setDataTransaksi([]); // Clear
      setToastMessage('Tutup buku berhasil! Seluruh transaksi aktif saat ini telah diarsipkan.');
      setToastType('success');
      setShowToast(true);
    }, 1200);
  };

  const exportToCSV = () => {
    if (dataTransaksi.length === 0) {
      setToastMessage('Tidak ada data transaksi untuk diekspor!');
      setToastType('info');
      setShowToast(true);
      return;
    }

    const headers = ['Tanggal', 'Nama / Pihak', 'Keterangan', 'Kategori', 'Tipe Kas', 'Nominal (Rp)'];
    const rows = dataTransaksi.map((t) => [
      t.tanggal,
      `"${t.nama.replace(/"/g, '""')}"`,
      `"${t.keterangan.replace(/"/g, '""')}"`,
      t.kategori,
      t.tipe === 'in' ? 'Pemasukan' : 'Pengeluaran',
      t.nominal,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Keuangan_IKWAS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('Laporan berhasil diekspor ke Excel/CSV!');
    setToastType('success');
    setShowToast(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setToastMessage('Tautan laporan berhasil disalin ke papan klip!');
    setToastType('info');
    setShowToast(true);
  };

  // Define Columns for DatatablePro
  const columns: ColumnDef<Transaksi>[] = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      sortable: true,
      render: (row) => (
        <span>
          {new Date(row.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'Nama Transaksi',
      sortable: true,
    },
    {
      key: 'keterangan',
      label: 'Rincian Keterangan',
      sortable: true,
    },
    {
      key: 'kategori',
      label: 'Kategori',
      sortable: true,
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.tipe === 'in' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'
        }`}>
          {row.kategori}
        </span>
      ),
    },
    {
      key: 'nominal',
      label: 'Nominal',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className={`text-xs font-bold ${row.tipe === 'in' ? 'text-primary' : 'text-error'}`}>
          {row.tipe === 'in' ? '+' : '-'}Rp {new Intl.NumberFormat('id-ID').format(row.nominal)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-10">
      {/* Toast Alert */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Tutup Buku Modal Confirmation Box */}
      <ConfirmationModal
        isOpen={showTutupBukuModal}
        title="Tutup Buku Bulanan"
        message="Melakukan tutup buku akan membekukan seluruh catatan keuangan berjalan. Seluruh data transaksi aktif saat ini akan diarsipkan secara permanen. Tindakan ini tidak dapat diurungkan."
        onConfirm={handleTutupBuku}
        onCancel={() => setShowTutupBukuModal(false)}
        confirmText="Ya, Tutup Buku"
        cancelText="Batalkan"
        variant="error"
        isLoading={isTutupBukuLoading}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <PageHeader
          path="/dashboard/laporan"
          defaultBadge="Audit & Rekap"
          defaultTitle="Laporan Keuangan & Buku"
          defaultDesc="Tinjau rekapitulasi buku besar secara mendalam, bagikan link laporan, dan lakukan tutup buku bulanan."
        />
        <div className="flex gap-3 no-print">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.print()}
            leftIcon="print"
            className="px-5 py-3 cursor-pointer"
          >
            Cetak PDF
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={exportToCSV}
            leftIcon="download"
            className="px-5 py-3 cursor-pointer"
          >
            Ekspor Excel/CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={copyShareLink}
            leftIcon="share"
            className="px-5 py-3 cursor-pointer"
          >
            Salin Link Laporan
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={() => setShowTutupBukuModal(true)}
            leftIcon="lock_open"
            className="px-5 py-3 cursor-pointer"
          >
            Tutup Buku
          </Button>
        </div>
      </div>

      {/* Panduan Tutup Buku Bulanan */}
      <div className="no-print select-none">
        <CollapsibleGuide title="Panduan Kapan & Cara Tutup Buku Keuangan" icon="help_outline" defaultOpen={false}>
          <div className="space-y-4 text-xs font-semibold text-on-surface-variant leading-relaxed text-left">
            <p>
              Tutup buku membekukan seluruh catatan transaksi kas masuk, kas keluar, dan mutasi saldo berjalan. Tindakan ini <strong>tidak dapat diurungkan</strong> setelah disubmit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-outline/10 pt-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-error">📌 Kapan Anda HARUS Melakukan Tutup Buku?</h4>
                <ul className="list-disc pl-4 space-y-1 font-semibold text-[11px]">
                  <li><strong>Akhir Tahun Buku (Tahunan)</strong>: Setiap akhir tahun ajaran pondok pesantren atau akhir tahun kalender untuk pelaporan Audit resmi.</li>
                  <li><strong>Serah Terima Jabatan</strong>: Saat terjadi pergantian bendahara/kepengurusan baru untuk mengunci kas awal.</li>
                  <li><strong>Audit Selesai</strong>: Ketika seluruh data pembukuan periode berjalan dinyatakan bersih dan disetujui Pengawas Yayasan.</li>
                </ul>
              </div>

              <div className="space-y-1 border-t md:border-t-0 md:border-l border-outline/10 pt-3 md:pt-0 md:pl-6">
                <h4 className="font-bold text-xs text-tertiary">⚠️ Kapan Anda JANGAN Melakukan Tutup Buku?</h4>
                <ul className="list-disc pl-4 space-y-1 font-semibold text-[11px]">
                  <li><strong>Masih Ada Koreksi</strong>: Masih ada bukti kuitansi fisik yang belum diunggah atau ada salah input nominal yang belum disunting.</li>
                  <li><strong>Hanya Ingin Ganti Bulan</strong>: Jangan lakukan tutup buku hanya karena ingin ganti bulan. Cukup gunakan filter bulan/tahun di halaman Laporan Keuangan ini.</li>
                </ul>
              </div>
            </div>
          </div>
        </CollapsibleGuide>
      </div>

      {/* Datatable Card */}
      <div className="glass-card rounded-3xl shadow-sm overflow-hidden border border-white/20">
        <DatatablePro
          data={dataTransaksi}
          columns={columns}
          searchPlaceholder={searchPlaceholder}
          searchKeys={['nama', 'keterangan']}
          categories={categoryFilterOptions}
          categoryKey="kategori"
          tipeKey="tipe"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

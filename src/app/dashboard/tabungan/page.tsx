'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import Toast from '@/components/molecules/Toast';
import DatatablePro, { ColumnDef } from '@/components/organisms/DatatablePro';
import CollapsibleGuide from '@/components/molecules/CollapsibleGuide';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';
import PageHeader from '@/components/molecules/PageHeader';

interface TabunganRow {
  id: string;
  santri_id: number;
  santri_name: string;
  wali: string;
  kelas: string;
  rekening_id: number;
  saldo: number;
}

interface Mutasi {
  id: number;
  rekening_id: number;
  tipe: 'setor' | 'tarik' | 'bayar_program';
  nominal: number;
  keterangan: string;
  tanggal: string;
  operator: string;
}

export default function TabunganPage() {
  const [dataTabungan, setDataTabungan] = useState<TabunganRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<TabunganRow | null>(null);
  const [mutasiList, setMutasiList] = useState<Mutasi[]>([]);

  // Transaction Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'setor' | 'tarik'>('setor');
  const [targetSantri, setTargetSantri] = useState<TabunganRow | null>(null);
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchTabungan = () => {
    setIsLoading(true);
    fetch('/api/tabungan')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            ...item,
            id: item.santri_id.toString(),
          }));
          setDataTabungan(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  const [searchPlaceholder, setSearchPlaceholder] = useState('Cari nama santri, wali...');

  useEffect(() => {
    fetchTabungan();
    const saved = localStorage.getItem('ikwas_sidebar_menu');
    if (saved) {
      const menu = JSON.parse(saved);
      const current = menu.find((item: any) => item.path === '/dashboard/tabungan');
      if (current && current.placeholder) {
        setSearchPlaceholder(current.placeholder);
      }
    }
  }, []);

  const handleOpenDetail = (row: TabunganRow) => {
    setSelectedSantri(row);
    fetch(`/api/tabungan?santri_id=${row.santri_id}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data && Array.isArray(data.mutasi)) {
          setMutasiList(data.mutasi);
          setShowDetailModal(true);
        }
      })
      .catch(() => {
        setToastMessage('Gagal mengambil riwayat mutasi.');
        setToastType('error');
        setShowToast(true);
      });
  };

  const handleOpenTransaction = (type: 'setor' | 'tarik', row: TabunganRow) => {
    setFormType(type);
    setTargetSantri(row);
    setNominal('');
    setKeterangan('');
    setShowFormModal(true);
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSantri) return;

    const num = parseInt(nominal.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num <= 0) {
      setToastMessage('Nominal transaksi tidak valid!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (formType === 'tarik' && targetSantri.saldo < num) {
      setToastMessage('Saldo tabungan santri tidak mencukupi!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);
    fetch('/api/tabungan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        santriId: targetSantri.santri_id,
        tipe: formType,
        nominal: num,
        keterangan,
      }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        setIsSubmitting(false);
        if (data.success) {
          setToastMessage(data.message || 'Transaksi berhasil diproses.');
          setToastType('success');
          setShowToast(true);
          setShowFormModal(false);
          fetchTabungan();
          // If detail modal of this student is currently open, refresh it too
          if (selectedSantri && selectedSantri.santri_id === targetSantri.santri_id) {
            handleOpenDetail(targetSantri);
          }
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastMessage(err.message || 'Gagal memproses transaksi.');
        setToastType('error');
        setShowToast(true);
      });
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const columns: ColumnDef<TabunganRow>[] = [
    {
      key: 'santri_name',
      label: 'Nama Lengkap Santri',
      sortable: true,
      render: (row) => (
        <button
          onClick={() => handleOpenDetail(row)}
          className="text-left font-bold text-primary hover:underline cursor-pointer outline-none"
        >
          {row.santri_name}
        </button>
      ),
    },
    {
      key: 'kelas',
      label: 'Kelas',
      sortable: true,
    },
    {
      key: 'wali',
      label: 'Nama Wali',
      sortable: true,
    },
    {
      key: 'saldo',
      label: 'Saldo Tabungan',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-extrabold text-on-surface">
          {formatRupiah(row.saldo)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi Cepat',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleOpenDetail(row)}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary-container text-on-secondary-container hover:bg-primary hover:text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border border-outline/20"
            title="Detail Mutasi & Buku Rekening"
          >
            <Icon name="visibility" className="text-xs" />
            Detail
          </button>
          <button
            onClick={() => handleOpenTransaction('setor', row)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border border-primary/20"
            title="Setor Tabungan"
          >
            <Icon name="add" className="text-xs" />
            Setor
          </button>
          <button
            onClick={() => handleOpenTransaction('tarik', row)}
            className="flex items-center gap-1 px-3 py-1.5 bg-error-container text-error hover:bg-error hover:text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border border-error/20"
            title="Tarik Tabungan"
            disabled={row.saldo <= 0}
          >
            <Icon name="remove" className="text-xs" />
            Tarik
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <PageHeader
        path="/dashboard/tabungan"
        defaultBadge="Modul Wadiah"
        defaultTitle="Buku Tabungan Santri"
        defaultDesc="Pencatatan titipan dana pribadi santri terpisah dari iuran wajib dan kas operasional yayasan."
      />

      {/* Spoiler Guide Box */}
      <CollapsibleGuide title="Petunjuk & Regulasi Tabungan" icon="help_outline" defaultOpen={false}>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-primary">Prinsip Titipan Syariah (Wadiah)</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold">
              Sesuai kaidah syariah, Tabungan Pribadi santri berstatus titipan murni (Liaibities) yang tidak boleh dicampur/dibelanjakan untuk operasional sekolah tanpa izin tertulis dari wali santri bersangkutan.
            </p>
          </div>
          <div className="border-t border-primary/10 pt-4 space-y-2">
            <h4 className="font-bold text-xs text-tertiary">Petunjuk Pencatatan</h4>
            <ul className="text-[11px] text-on-surface-variant space-y-2 font-semibold">
              <li>&bull; Klik <strong>Nama Santri</strong> untuk melihat riwayat mutasi masuk/keluar layaknya rekening koran bank.</li>
              <li>&bull; Gunakan tombol <strong>Setor</strong> untuk menambahkan saldo titipan wali santri.</li>
              <li>&bull; Gunakan tombol <strong>Tarik</strong> untuk mengambil saldo titipan (misalnya ditarik tunai atau didebet untuk alokasi program BI).</li>
            </ul>
          </div>
        </div>
      </CollapsibleGuide>

      {/* Main Datatable */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-white/20">
        <div className="p-4 px-6 border-b border-white/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/20">
          <h3 className="font-bold text-sm text-on-surface">Daftar Saldo Rekening Santri</h3>
          {/* Search box aligned to right */}
          <div className="flex items-center gap-2 bg-white/85 px-4 py-2 rounded-2xl border border-primary/10 w-full md:w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all select-none">
            <Icon name="search" className="text-primary text-sm" />
            <input
              type="text"
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-on-surface-variant/40 text-on-surface font-semibold"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <DatatablePro
          data={dataTabungan}
          columns={columns}
          searchKeys={['santri_name', 'wali', 'kelas']}
          hideToolbarSearch={true}
          externalSearchTerm={searchTerm}
        />
      </div>

      {/* Transaction Setor/Tarik Modal */}
      {showFormModal && targetSantri && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[448px] overflow-visible animate-fade-in-up border border-primary/10 text-left">
            <div className="p-6 primary-gradient text-white flex justify-between items-center rounded-t-3xl">
              <h3 className="font-bold text-sm">
                {formType === 'setor' ? 'Setoran Tabungan' : 'Penarikan Tabungan'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-1">
                <span className="text-[10px] text-primary font-bold uppercase">Rekening Santri</span>
                <h4 className="text-sm font-extrabold text-on-surface">{targetSantri.santri_name}</h4>
                <p className="text-xs text-on-surface-variant font-semibold">
                  Wali: {targetSantri.wali} | Kelas: {targetSantri.kelas}
                </p>
                <p className="text-xs text-primary font-extrabold pt-2 border-t border-primary/10 mt-2">
                  Saldo Saat Ini: {formatRupiah(targetSantri.saldo)}
                </p>
              </div>

              <FormField label="Nominal Transaksi (Rupiah)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant/40">
                    Rp
                  </span>
                  <Input
                    id="nominal-transaksi"
                    type="text"
                    required
                    placeholder="Contoh: 150.000"
                    className="pl-10"
                    value={nominal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNominal(val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '');
                    }}
                  />
                </div>
              </FormField>

              <FormField label="Keterangan / Catatan Transaksi">
                <Input
                  id="ket-transaksi"
                  type="text"
                  placeholder={
                    formType === 'setor'
                      ? 'Contoh: Titipan uang bulanan wali santri'
                      : 'Contoh: Penarikan tunai keperluan pribadi santri'
                  }
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                />
              </FormField>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowFormModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant={formType === 'setor' ? 'primary' : 'error'}
                  isLoading={isSubmitting}
                  className="flex-1 py-3 cursor-pointer"
                >
                  Proses
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail & Mutasi Modal */}
      {showDetailModal && selectedSantri && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto z-[999] animate-fade-in-up border border-primary/10 text-left">
            <div className="p-6 primary-gradient text-white flex justify-between items-center rounded-t-3xl sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-sm">Buku Rekening Tabungan</h3>
                <p className="text-xs text-white/80 font-bold">{selectedSantri.santri_name}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Saldo info card */}
              <div className="flex justify-between items-center bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                <div>
                  <p className="text-[10px] text-primary font-bold uppercase">Total Saldo Simpanan Wadiah</p>
                  <h2 className="text-xl font-extrabold text-on-surface">{formatRupiah(selectedSantri.saldo)}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenTransaction('setor', selectedSantri);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer hover:brightness-105 active:scale-95 transition-all"
                  >
                    <Icon name="add" className="text-sm font-bold" />
                    Setor
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenTransaction('tarik', selectedSantri);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-error text-white rounded-2xl text-xs font-bold shadow-md shadow-error/20 cursor-pointer hover:brightness-105 active:scale-95 transition-all"
                    disabled={selectedSantri.saldo <= 0}
                  >
                    <Icon name="remove" className="text-sm font-bold" />
                    Tarik
                  </button>
                </div>
              </div>

              {/* Mutasi Table list */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Histori Mutasi Tabungan</h4>
                <div className="overflow-x-auto border border-outline/10 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary/5 text-primary text-[10px] font-bold border-b border-primary/10 select-none">
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Keterangan</th>
                        <th className="px-4 py-3 text-right">Debit (Tarik)</th>
                        <th className="px-4 py-3 text-right">Kredit (Setor)</th>
                        <th className="px-4 py-3">Petugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10 text-xs font-semibold text-on-surface">
                      {mutasiList.map((m) => (
                        <tr key={m.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(m.tanggal.includes('Z') ? m.tanggal : m.tanggal + ' UTC').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3">{m.keterangan}</td>
                          <td className="px-4 py-3 text-right text-error font-extrabold">
                            {m.tipe === 'tarik' || m.tipe === 'bayar_program' ? formatRupiah(m.nominal) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-primary font-extrabold">
                            {m.tipe === 'setor' ? formatRupiah(m.nominal) : '-'}
                          </td>
                          <td className="px-4 py-3 text-outline text-[10px]">{m.operator || 'System'}</td>
                        </tr>
                      ))}
                      {mutasiList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant text-[11px]">
                            Belum ada riwayat mutasi tabungan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 cursor-pointer"
                >
                  Tutup Buku Rekening
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

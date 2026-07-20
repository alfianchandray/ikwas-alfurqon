'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import Toast from '@/components/molecules/Toast';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';
import PageHeader from '@/components/molecules/PageHeader';

interface Santri {
  id: string;
  name: string;
  wali: string;
  kelas: string;
}

interface ClassOption {
  value: string;
  label: string;
}

interface TagihanRow {
  tagihan_id: number;
  periode: string;
  status: 'lunas' | 'belum_bayar';
  nominal: number;
  tanggal_bayar: string | null;
  santri_name: string;
  wali: string;
  kelas: string | null;
}

interface CategoryOption {
  value: string;
  label: string;
}

export default function SantriPage() {
  const [activeTab, setActiveTab] = useState<'santri' | 'tagihan'>('santri');

  // Tab 1: Santri States
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [classList, setClassList] = useState<ClassOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWali, setNewWali] = useState('');
  const [newKelas, setNewKelas] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Permissions
  const [canWriteSantri, setCanWriteSantri] = useState(true);
  const [canWriteTagihan, setCanWriteTagihan] = useState(true);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [santriToDelete, setSantriToDelete] = useState<Santri | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab 2: Billing States
  const [kategoriList, setKategoriList] = useState<CategoryOption[]>([]);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [billingList, setBillingList] = useState<TagihanRow[]>([]);
  const [billingSearchTerm, setBillingSearchTerm] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState('');
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetBill, setTargetBill] = useState<TagihanRow | null>(null);
  const [paymentNominal, setPaymentNominal] = useState(150000);
  const [paymentKeterangan, setPaymentKeterangan] = useState('');
  const [paymentTanggal, setPaymentTanggal] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Ketik nama santri...');
  const [isEditMode, setIsEditMode] = useState(false);
  const [santriToEdit, setSantriToEdit] = useState<Santri | null>(null);

  const triggerEdit = (s: Santri) => {
    setSantriToEdit(s);
    setNewName(s.name);
    setNewWali(s.wali);
    const foundClass = classList.find((c) => c.label === s.kelas);
    setNewKelas(foundClass ? foundClass.value : (classList[0]?.value || ''));
    setIsEditMode(true);
    setShowAddModal(true);
  };

  // Global Toast
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error' | 'info'>('success');

  const showNotification = (msg: string, type: 'success' | 'warning' | 'error' | 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const fetchSantri = () => {
    fetch('/api/santri')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setSantriList(data);
      })
      .catch(() => {});
  };

  const fetchClasses = () => {
    fetch('/api/kelas')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setClassList(data.map((c) => ({ value: c.id.toString(), label: c.name })));
          if (data.length > 0) setNewKelas(data[0].id.toString());
        }
      })
      .catch(() => {});
  };

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          // Filter only cash in categories
          const inCats = data
            .filter((c) => c.tipe === 'in')
            .map((c) => ({ value: c.id.toString(), label: c.name }));
          setKategoriList(inCats);
          if (inCats.length > 0) setSelectedKategori(inCats[0].value);
        }
      })
      .catch(() => {});
  };

  // Load Billing list
  const fetchBillingList = () => {
    if (!selectedKategori || !selectedPeriode) return;
    setIsBillingLoading(true);
    fetch(`/api/tagihan?kategori_id=${selectedKategori}&periode=${encodeURIComponent(selectedPeriode)}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setBillingList(data);
        } else {
          setBillingList([]);
        }
        setIsBillingLoading(false);
      })
      .catch(() => {
        setBillingList([]);
        setIsBillingLoading(false);
      });
  };

  // Default periode to current Month (YYYY-MM)
  useEffect(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setSelectedPeriode(`${yyyy}-${mm}`);
    fetchSantri();
    fetchClasses();
    fetchCategories();

    // Load permissions
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('ikwas_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.role === 'Super Admin') {
            setCanWriteSantri(true);
            setCanWriteTagihan(true);
          } else if (user.permissions) {
            setCanWriteSantri(!!user.permissions.santri_write);
            setCanWriteTagihan(!!user.permissions.tagihan_write);
          }
        } catch {}
      }
    }

    // Load custom placeholder from settings
    const saved = localStorage.getItem('ikwas_sidebar_menu');
    if (saved) {
      const menu = JSON.parse(saved);
      const current = menu.find((item: any) => item.path === '/dashboard/santri');
      if (current && current.placeholder) {
        setSearchPlaceholder(current.placeholder);
      }
    }
  }, []);

  // Fetch billing when variables change
  useEffect(() => {
    fetchBillingList();
  }, [selectedKategori, selectedPeriode, activeTab]);

  // Tab 1 Handlers
  const handleAddSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newWali) return;
    setIsLoading(true);

    const url = '/api/santri';
    const method = isEditMode ? 'PUT' : 'POST';
    const payload = isEditMode
      ? { id: santriToEdit?.id, name: newName, wali: newWali, kelas_id: newKelas }
      : { name: newName, wali: newWali, kelas_id: newKelas };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data: any) => {
        setIsLoading(false);
        if (data.success) {
          setShowAddModal(false);
          setNewName('');
          setNewWali('');
          setIsEditMode(false);
          setSantriToEdit(null);
          showNotification(isEditMode ? 'Data santri berhasil diperbarui.' : 'Data santri baru berhasil ditambahkan.', 'success');
          fetchSantri();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.message || 'Gagal menyimpan data santri.', 'error');
      });
  };

  const triggerDelete = (santri: Santri) => {
    setSantriToDelete(santri);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!santriToDelete) return;
    setIsDeleting(true);

    fetch(`/api/santri?id=${santriToDelete.id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data: any) => {
        setIsDeleting(false);
        setShowDeleteModal(false);
        if (data.success) {
          showNotification(`Data santri "${santriToDelete.name}" berhasil dihapus.`, 'warning');
          setSantriToDelete(null);
          fetchSantri();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setIsDeleting(false);
        showNotification(err.message || 'Gagal menghapus data.', 'error');
      });
  };

  // Payment Quick Modal Trigger
  const triggerPayment = (bill: TagihanRow) => {
    setTargetBill(bill);
    setPaymentNominal(bill.nominal > 0 ? bill.nominal : 150000);
    // Find category name
    const catName = kategoriList.find((c) => c.value === selectedKategori)?.label || 'Iuran';
    setPaymentKeterangan(`Pelunasan ${catName} - ${bill.santri_name} Periode ${selectedPeriode}`);
    
    // Set default payment date to today in YYYY-MM-DD
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    setPaymentTanggal(`${yyyy}-${mm}-${dd}`);
    
    setShowPaymentModal(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBill) return;
    setIsProcessingPayment(true);

    fetch('/api/tagihan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagihan_id: targetBill.tagihan_id,
        nominal: paymentNominal,
        keterangan: paymentKeterangan,
        tanggal: paymentTanggal,
      }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        setIsProcessingPayment(false);
        if (data.success) {
          setShowPaymentModal(false);
          showNotification(`Pembayaran berhasil disimpan & kas masuk tercatat otomatis.`, 'success');
          fetchBillingList();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setIsProcessingPayment(false);
        showNotification(err.message || 'Gagal memproses pembayaran.', 'error');
      });
  };

  // Filter calculations
  const filteredSantri = santriList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.wali.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBilling = billingList.filter((b) => {
    const matchesSearch =
      b.santri_name.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
      b.wali.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
      (b.kelas && b.kelas.toLowerCase().includes(billingSearchTerm.toLowerCase()));

    const matchesStatus =
      billingStatusFilter === '' || b.status === billingStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 text-left">
      {/* Toast Alert */}
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Hapus Data Santri"
        message={`Apakah Anda yakin ingin menghapus data santri "${santriToDelete?.name}"? Semua data tabungan dan relasi tagihan santri ini juga akan dihapus permanen.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmText={isDeleting ? 'Menghapus...' : 'Hapus Santri'}
        cancelText="Batalkan"
        variant="error"
      />

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-visible animate-fade-in-up flex-shrink-0 min-w-[320px] md:min-w-[448px]">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{isEditMode ? 'Ubah Data Santri' : 'Registrasi Santri Baru'}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditMode(false);
                  setNewName('');
                  setNewWali('');
                  setSantriToEdit(null);
                }}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <form onSubmit={handleAddSantri} className="p-6 space-y-4">
              <FormField label="Nama Lengkap Santri">
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rafli"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </FormField>
              <FormField label="Nama Wali Murid">
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. H. Ahmad Suraji"
                  value={newWali}
                  onChange={(e) => setNewWali(e.target.value)}
                />
              </FormField>
              <FormField label="Kelas Santri">
                <Select
                  options={classList}
                  value={newKelas}
                  onChange={setNewKelas}
                />
              </FormField>
              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-5 py-3"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditMode(false);
                    setNewName('');
                    setNewWali('');
                    setSantriToEdit(null);
                  }}
                >
                  Batalkan
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading} leftIcon="save" className="px-5 py-3">
                  Simpan Santri
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-visible animate-fade-in-up flex-shrink-0 min-w-[320px] md:min-w-[448px]">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Icon name="payments" className="text-sm" />
                Pelunasan Tagihan Cepat
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-1.5 text-xs font-semibold text-on-surface">
                <div className="flex justify-between">
                  <span className="text-outline">Nama Santri:</span>
                  <span className="font-extrabold text-primary">{targetBill?.santri_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Wali Murid:</span>
                  <span>{targetBill?.wali}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Program:</span>
                  <span className="font-bold">
                    {kategoriList.find((c) => c.value === selectedKategori)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Periode:</span>
                  <span>{targetBill?.periode}</span>
                </div>
              </div>

              <FormField label="Nominal Pelunasan (Rupiah)">
                <Input
                  type="number"
                  required
                  min="1"
                  value={paymentNominal}
                  onChange={(e) => setPaymentNominal(parseInt(e.target.value) || 0)}
                />
              </FormField>

              <FormField label="Keterangan Transaksi / Catatan">
                <Input
                  type="text"
                  required
                  value={paymentKeterangan}
                  onChange={(e) => setPaymentKeterangan(e.target.value)}
                />
              </FormField>

              <FormField label="Tanggal Pelunasan">
                <Input
                  type="date"
                  required
                  value={paymentTanggal}
                  onChange={(e) => setPaymentTanggal(e.target.value)}
                />
              </FormField>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Batalkan
                </Button>
                <Button type="submit" variant="primary" isLoading={isProcessingPayment} leftIcon="check">
                  Proses Bayar Lunas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <PageHeader
        path="/dashboard/santri"
        defaultBadge="Manajemen Santri"
        defaultTitle="Data Santri & Wali"
        defaultDesc="Pengelolaan database biodata santri pesantren beserta pelacakan iuran bulanan, uang gedung, seragam, dan tagihan lainnya."
      />

      {/* Tabs */}
      <div className="flex border-b border-outline/10 gap-2 select-none">
        <button
          onClick={() => setActiveTab('santri')}
          className={`px-5 py-3.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'santri'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Biodata Santri
        </button>
        <button
          onClick={() => setActiveTab('tagihan')}
          className={`px-5 py-3.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'tagihan'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Status Pembayaran (Tagihan)
        </button>
      </div>

      {/* Tab 1: Biodata Santri */}
      {activeTab === 'santri' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
            {/* Search Box */}
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-primary/10 w-full md:w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all select-none">
              <Icon name="search" className="text-primary text-lg" />
              <input
                type="text"
                className="bg-transparent border-none outline-none text-xs w-full placeholder:text-on-surface-variant/40 text-on-surface font-semibold"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canWriteSantri && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full md:w-auto px-5 py-3 bg-primary text-white font-extrabold text-xs rounded-2xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon name="person_add" className="text-base" />
                Registrasi Santri
              </button>
            )}
          </div>
 
          {/* Table */}
          <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-on-surface">
                <thead>
                  <tr className="bg-white/40 border-b border-white/20 text-primary font-extrabold uppercase tracking-wider">
                    <th className="p-4 px-6">Nama Santri</th>
                    <th className="p-4 px-6">Wali Murid</th>
                    <th className="p-4 px-6">Kelas</th>
                    <th className="p-4 px-6 text-center no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredSantri.length > 0 ? (
                    filteredSantri.map((s) => (
                      <tr key={s.id} className="hover:bg-white/20 transition-colors">
                        <td className="p-4 px-6 font-bold">{s.name}</td>
                        <td className="p-4 px-6">{s.wali}</td>
                        <td className="p-4 px-6">{s.kelas}</td>
                        <td className="p-4 px-6 text-center no-print flex items-center justify-center gap-1.5">
                          {canWriteSantri ? (
                            <>
                              <button
                                type="button"
                                onClick={() => triggerEdit(s)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                                title="Ubah Data"
                              >
                                <Icon name="edit" className="text-base font-bold" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerDelete(s)}
                                className="p-2 text-error hover:bg-error/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                                title="Hapus Data"
                              >
                                <Icon name="delete" className="text-base font-bold" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-outline italic">Hanya Lihat</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-outline font-semibold">
                        Tidak ada data santri ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Status Pembayaran (Tagihan Dinamis) */}
      {activeTab === 'tagihan' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-primary/5 p-4 rounded-3xl border border-primary/10">
            <FormField label="Kategori Pembayaran">
              <Select
                options={kategoriList}
                value={selectedKategori}
                onChange={setSelectedKategori}
              />
            </FormField>

            <FormField label="Periode Tagihan (Bulan)">
              <Input
                type="month"
                required
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
              />
            </FormField>

            <FormField label="Filter Status Bayar">
              <Select
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'lunas', label: 'Lunas' },
                  { value: 'belum_bayar', label: 'Belum Bayar (Menunggak)' },
                ]}
                value={billingStatusFilter}
                onChange={setBillingStatusFilter}
              />
            </FormField>

            <FormField label="Cari Nama Santri">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-primary/10 focus-within:ring-2 focus-within:ring-primary/20 transition-all select-none">
                <Icon name="search" className="text-primary text-xs" />
                <input
                  type="text"
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-on-surface-variant/40 text-on-surface font-semibold"
                  placeholder={searchPlaceholder}
                  value={billingSearchTerm}
                  onChange={(e) => setBillingSearchTerm(e.target.value)}
                />
              </div>
            </FormField>
          </div>

          {/* Table */}
          <div className="glass-card rounded-3xl overflow-hidden shadow-sm border border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-on-surface">
                <thead>
                  <tr className="bg-white/40 border-b border-white/20 text-primary font-extrabold uppercase tracking-wider">
                    <th className="p-4 px-6">Nama Santri</th>
                    <th className="p-4 px-6">Wali</th>
                    <th className="p-4 px-6">Kelas</th>
                    <th className="p-4 px-6">Status Iuran</th>
                    <th className="p-4 px-6">Nominal Bayar</th>
                    <th className="p-4 px-6">Tanggal Lunas</th>
                    <th className="p-4 px-6 text-center no-print">Aksi Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {isBillingLoading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-outline">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Memuat data tagihan...
                      </td>
                    </tr>
                  ) : filteredBilling.length > 0 ? (
                    filteredBilling.map((b) => (
                      <tr key={b.tagihan_id} className="hover:bg-white/20 transition-colors">
                        <td className="p-4 px-6 font-bold">{b.santri_name}</td>
                        <td className="p-4 px-6">{b.wali}</td>
                        <td className="p-4 px-6">{b.kelas || '-'}</td>
                        <td className="p-4 px-6">
                          {b.status === 'lunas' ? (
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-[10px] font-extrabold uppercase animate-pulse">
                              Belum Bayar
                            </span>
                          )}
                        </td>
                        <td className="p-4 px-6 font-extrabold">
                          {b.nominal > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(b.nominal)}` : '-'}
                        </td>
                        <td className="p-4 px-6 text-outline text-[11px]">
                          {b.tanggal_bayar ? b.tanggal_bayar.substring(0, 16) : '-'}
                        </td>
                        <td className="p-4 px-6 text-center no-print">
                          {b.status === 'belum_bayar' ? (
                            canWriteTagihan ? (
                              <button
                                onClick={() => triggerPayment(b)}
                                className="px-3.5 py-1.5 bg-primary text-white text-[10px] font-extrabold uppercase rounded-xl hover:brightness-105 transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center gap-1 mx-auto"
                              >
                                <Icon name="price_check" className="text-sm" />
                                Bayar Cepat
                              </button>
                            ) : (
                              <span className="text-[10px] text-error font-extrabold flex items-center justify-center gap-1">
                                <Icon name="pending" className="text-sm animate-pulse" />
                                Menunggak
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-outline font-bold flex items-center justify-center gap-1 text-primary">
                              <Icon name="check_circle" className="text-sm" />
                              Selesai
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-outline font-semibold">
                        Tidak ada data tagihan ditemukan. Silakan sesuaikan kategori atau periode filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

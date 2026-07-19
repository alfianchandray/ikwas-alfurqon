'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormField from '@/components/molecules/FormField';
import Toast from '@/components/molecules/Toast';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';
import ImagePicker from '@/components/molecules/ImagePicker';
import CollapsibleGuide from '@/components/molecules/CollapsibleGuide';
import PageHeader from '@/components/molecules/PageHeader';

interface Kelas {
  id: string;
  name: string;
}

interface NavLink {
  id: string;
  name: string;
  url: string;
}

interface Category {
  id: string;
  name: string;
  tipe: 'in' | 'out';
}

interface PageHeaderData {
  path: string;
  badge: string;
  title: string;
  description: string;
}

interface SiteConfig {
  siteName: string;
  siteDesc: string;
  themeColor: string;
  logoType: string;
  faviconUrl: string;
  logoUrl: string;
}

export default function PengaturanPage() {
  // Tab State: 'branding' | 'database' | 'headers'
  const [activeTab, setActiveTab] = useState<'branding' | 'database' | 'headers'>('branding');

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    siteName: 'IKWAS Al-Furqon',
    siteDesc: 'Sistem manajemen keuangan terpadu Ikatan Keluarga Santri dengan amanah dan transparan.',
    themeColor: 'teal',
    logoType: 'medallion',
    faviconUrl: '',
    logoUrl: '',
  });

  const [classes, setClasses] = useState<Kelas[]>([]);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sidebarMenuItems, setSidebarMenuItems] = useState<{ id: number; name: string; icon: string; sort_order: number }[]>([]);

  // Add inputs state
  const [newKelasName, setNewKelasName] = useState('');
  const [newNavLinkName, setNewNavLinkName] = useState('');
  const [newNavLinkUrl, setNewNavLinkUrl] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTipe, setNewCategoryTipe] = useState<'in' | 'out'>('in');

  // Page Headers CMS State
  const [selectedPath, setSelectedPath] = useState('/dashboard');
  const [pageHeaderForm, setPageHeaderForm] = useState<PageHeaderData>({
    path: '/dashboard',
    badge: '',
    title: '',
    description: '',
  });

  // Modals & Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');

  const [showDeleteKelasModal, setShowDeleteKelasModal] = useState(false);
  const [kelasToDelete, setKelasToDelete] = useState<Kelas | null>(null);

  const [showDeleteNavLinkModal, setShowDeleteNavLinkModal] = useState(false);
  const [navLinkToDelete, setNavLinkToDelete] = useState<NavLink | null>(null);

  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [showTutupBukuModal, setShowTutupBukuModal] = useState(false);
  const [isProcessingTutupBuku, setIsProcessingTutupBuku] = useState(false);

  const fetchConfig = () => {
    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.site_name) {
          setSiteConfig({
            siteName: data.site_name,
            siteDesc: data.site_desc,
            themeColor: data.theme_color || 'teal',
            logoType: data.logo_type || 'medallion',
            faviconUrl: data.favicon_url || '',
            logoUrl: data.logo_url || '',
          });
        }
      })
      .catch(() => {});
  };

  const fetchClasses = () => {
    fetch('/api/kelas')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setClasses(data);
      })
      .catch(() => {});
  };

  const fetchNavLinks = () => {
    fetch('/api/nav-links')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setNavLinks(data);
      })
      .catch(() => {});
  };

  const fetchCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  };

  const fetchSidebarMenu = () => {
    fetch('/api/sidebar-menu')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setSidebarMenuItems(data);
      })
      .catch(() => {});
  };

  const fetchSelectedPageHeader = (path: string) => {
    fetch(`/api/page-headers?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.title) {
          setPageHeaderForm({
            path: data.path,
            badge: data.badge || '',
            title: data.title,
            description: data.description || '',
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchConfig();
    fetchClasses();
    fetchNavLinks();
    fetchCategories();
    fetchSidebarMenu();
    fetchSelectedPageHeader(selectedPath);
  }, []);

  useEffect(() => {
    fetchSelectedPageHeader(selectedPath);
  }, [selectedPath]);

  // Save Settings Handler
  const handleSaveSiteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: siteConfig.siteName,
        siteDesc: siteConfig.siteDesc,
        themeColor: siteConfig.themeColor,
        logoType: siteConfig.logoType,
        faviconUrl: siteConfig.faviconUrl,
        logoUrl: siteConfig.logoUrl,
      }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setToastMessage('Pengaturan situs berhasil diperbarui!');
          setToastType('success');
          setShowToast(true);
          fetchConfig();
          // Update localstorage brand to avoid flicker
          localStorage.setItem('ikwas_site_config', JSON.stringify({ siteName: siteConfig.siteName }));
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menyimpan pengaturan.');
        setToastType('error');
        setShowToast(true);
      });
  };

  // Classes Handlers
  const handleAddKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKelasName) return;
    fetch('/api/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKelasName }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setNewKelasName('');
          setToastMessage('Kelas baru berhasil ditambahkan.');
          setToastType('success');
          setShowToast(true);
          fetchClasses();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menambahkan kelas.');
        setToastType('error');
        setShowToast(true);
      });
  };

  const handleConfirmDeleteKelas = () => {
    if (!kelasToDelete) return;
    fetch(`/api/kelas?id=${kelasToDelete.id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data: any) => {
        setShowDeleteKelasModal(false);
        if (data.success) {
          setToastMessage(`Kelas "${kelasToDelete.name}" berhasil dihapus.`);
          setToastType('warning');
          setShowToast(true);
          setKelasToDelete(null);
          fetchClasses();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menghapus kelas.');
        setToastType('error');
        setShowToast(true);
      });
  };

  // Nav Tautan Handlers
  const handleAddNavLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNavLinkName || !newNavLinkUrl) return;
    fetch('/api/nav-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newNavLinkName, url: newNavLinkUrl }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setNewNavLinkName('');
          setNewNavLinkUrl('');
          setToastMessage('Menu navigasi baru ditambahkan.');
          setToastType('success');
          setShowToast(true);
          fetchNavLinks();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menambahkan menu.');
        setToastType('error');
        setShowToast(true);
      });
  };

  const handleConfirmDeleteNavLink = () => {
    if (!navLinkToDelete) return;
    fetch(`/api/nav-links?id=${navLinkToDelete.id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data: any) => {
        setShowDeleteNavLinkModal(false);
        if (data.success) {
          setToastMessage(`Tautan "${navLinkToDelete.name}" dihapus.`);
          setToastType('warning');
          setShowToast(true);
          setNavLinkToDelete(null);
          fetchNavLinks();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menghapus tautan.');
        setToastType('error');
        setShowToast(true);
      });
  };

  // Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, tipe: newCategoryTipe }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setNewCategoryName('');
          setToastMessage('Kategori keuangan baru berhasil disimpan.');
          setToastType('success');
          setShowToast(true);
          fetchCategories();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menambahkan kategori.');
        setToastType('error');
        setShowToast(true);
      });
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    fetch(`/api/categories?id=${categoryToDelete.id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data: any) => {
        setShowDeleteCategoryModal(false);
        if (data.success) {
          setToastMessage(data.message || `Kategori "${categoryToDelete.name}" berhasil dihapus.`);
          setToastType('warning');
          setShowToast(true);
          setCategoryToDelete(null);
          fetchCategories();
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menghapus kategori.');
        setToastType('error');
        setShowToast(true);
      });
  };

  // CMS Header Page Save
  const handleSavePageHeader = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/page-headers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageHeaderForm),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setToastMessage('Heading halaman berhasil diperbarui secara dinamis!');
          setToastType('success');
          setShowToast(true);
          fetchSelectedPageHeader(selectedPath);
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal memperbarui header halaman.');
        setToastType('error');
        setShowToast(true);
      });
  };

  // Save Sidebar Reorder
  const handleSaveSidebarOrder = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/sidebar-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItems: sidebarMenuItems }),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setToastMessage('Urutan menu sidebar berhasil diperbarui!');
          setToastType('success');
          setShowToast(true);
          fetchSidebarMenu();
          // Reload page to reflect sidebar change immediately
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          throw new Error(data.error);
        }
      })
      .catch((err) => {
        setToastMessage(err.message || 'Gagal menata ulang sidebar.');
        setToastType('error');
        setShowToast(true);
      });
  };

  // Tutup Buku Action (Simulasi/Proses)
  const handleExecuteTutupBuku = () => {
    setIsProcessingTutupBuku(true);
    // Simulate API request delay
    setTimeout(() => {
      setIsProcessingTutupBuku(false);
      setShowTutupBukuModal(false);
      setToastMessage('✅ Proses Tutup Buku Berhasil! Catatan keuangan telah dibekukan & diarsipkan.');
      setToastType('success');
      setShowToast(true);
    }, 2500);
  };

  const logoOptions = [
    { value: 'medallion', label: 'Mandala Medallion (Tradisional)' },
    { value: 'dome', label: 'Dome (Kubah Masjid)' },
    { value: 'crescent', label: 'Crescent Moon (Bulan Sabit)' },
    { value: 'star', label: 'Octagram Star (Bintang Segi Delapan)' },
  ];

  const colorOptions = [
    { value: 'teal', label: 'Islamic Teal (Khas Syariah)' },
    { value: 'emerald', label: 'Emerald Islami (Hijau Klasik)' },
    { value: 'gold', label: 'Royal Gold (Kuning Emas)' },
    { value: 'indigo', label: 'Lapis Blue (Modern)' },
  ];

  const dashboardPages = [
    { value: '/dashboard', label: 'Beranda Keuangan' },
    { value: '/dashboard/pemasukan', label: 'Form Pemasukan Pintar' },
    { value: '/dashboard/pengeluaran', label: 'Form Pengeluaran Baru' },
    { value: '/dashboard/santri', label: 'Data Santri & Wali' },
    { value: '/dashboard/tabungan', label: 'Buku Tabungan Santri' },
    { value: '/dashboard/laporan', label: 'Laporan Keuangan (Buku Besar)' },
    { value: '/dashboard/pengguna', label: 'Pengurus & Hak Akses' },
    { value: '/dashboard/pengaturan', label: 'Pengaturan Situs (Branding)' },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Toast Alert */}
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteKelasModal}
        title="Hapus Data Kelas"
        message={`Apakah Anda yakin ingin menghapus kelas "${kelasToDelete?.name}"?`}
        onConfirm={handleConfirmDeleteKelas}
        onCancel={() => setShowDeleteKelasModal(false)}
        confirmText="Hapus Kelas"
        cancelText="Batalkan"
        variant="error"
      />

      <ConfirmationModal
        isOpen={showDeleteNavLinkModal}
        title="Hapus Navigasi Publik"
        message={`Apakah Anda yakin ingin menghapus tautan menu "${navLinkToDelete?.name}"?`}
        onConfirm={handleConfirmDeleteNavLink}
        onCancel={() => setShowDeleteNavLinkModal(false)}
        confirmText="Hapus Menu"
        cancelText="Batalkan"
        variant="error"
      />

      <ConfirmationModal
        isOpen={showDeleteCategoryModal}
        title="Hapus Kategori Transaksi"
        message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"? Transaksi yang sudah terlanjur menggunakan kategori ini mungkin terpengaruh.`}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setShowDeleteCategoryModal(false)}
        confirmText="Hapus Kategori"
        cancelText="Batalkan"
        variant="error"
      />

      {/* Tutup Buku Modal */}
      {showTutupBukuModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-fade-in-up border border-error/10 text-left">
            <div className="p-6 bg-error text-white flex justify-between items-center rounded-t-3xl">
              <h3 className="font-bold text-sm">⚠️ Konfirmasi Tutup Buku</h3>
              <button
                onClick={() => !isProcessingTutupBuku && setShowTutupBukuModal(false)}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
                disabled={isProcessingTutupBuku}
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-error-container text-error rounded-2xl border border-error/20 text-xs font-bold leading-relaxed space-y-2">
                <p>🚨 PERINGATAN KERAS:</p>
                <p>Melakukan tutup buku akan membekukan seluruh transaksi berjalan pada periode aktif saat ini. Data transaksi akan diarsipkan permanen dan tabel kas berjalan akan dikosongkan untuk periode buku baru.</p>
              </div>

              <div className="space-y-2 text-xs font-semibold text-on-surface">
                <p>Silakan ketik kalimat di bawah ini untuk mengonfirmasi:</p>
                <p className="bg-surface-container p-2.5 rounded-xl font-bold select-none text-center tracking-wider text-primary border border-outline/10">
                  SAYA YAKIN TUTUP BUKU
                </p>
                <input
                  type="text"
                  placeholder="Ketik persis kalimat di atas..."
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline/20 rounded-xl focus:ring-2 focus:ring-error focus:outline-none text-xs font-bold"
                  onChange={(e) => {
                    const btn = document.getElementById('btn-confirm-tutup-buku') as HTMLButtonElement;
                    if (btn) btn.disabled = e.target.value !== 'SAYA YAKIN TUTUP BUKU';
                  }}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowTutupBukuModal(false)}
                  disabled={isProcessingTutupBuku}
                  className="flex-1 py-3 cursor-pointer"
                >
                  Batalkan
                </Button>
                <button
                  id="btn-confirm-tutup-buku"
                  type="button"
                  disabled={true}
                  onClick={handleExecuteTutupBuku}
                  className="flex-1 py-3 bg-error text-white font-extrabold text-xs rounded-2xl hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-error/20"
                >
                  {isProcessingTutupBuku ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    'Tutup Buku'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <PageHeader
        path="/dashboard/pengaturan"
        defaultBadge="Sistem"
        defaultTitle="Pengaturan Situs"
        defaultDesc="Kelola visual, ornamen branding Islami, tautan navigasi portal publik, data kelas, serta ganti kata sandi pribadi Anda."
      />

      {/* Tab Navigation Controls */}
      <div className="flex border-b border-outline/10 gap-2 select-none">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-5 py-3.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'branding'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Branding &amp; Navigasi
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-5 py-3.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'database'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Struktur Keuangan
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-5 py-3.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'headers'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Pengaturan Halaman (CMS)
        </button>
      </div>

      {/* Tab Content 1: Branding & Navigasi */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-2 space-y-6">
            {/* Form Identitas */}
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20">
              <h3 className="font-bold text-sm text-on-surface mb-4">Identitas &amp; Logo Yayasan</h3>
              <form onSubmit={handleSaveSiteConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nama Yayasan / Pimpinan">
                    <Input
                      type="text"
                      required
                      value={siteConfig.siteName}
                      onChange={(e) => setSiteConfig({ ...siteConfig, siteName: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Warna Aksen Aplikasi">
                    <Select
                      options={colorOptions}
                      value={siteConfig.themeColor}
                      onChange={(val) => setSiteConfig({ ...siteConfig, themeColor: val })}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Simbol Logo Islami">
                    <Select
                      options={logoOptions}
                      value={siteConfig.logoType}
                      onChange={(val) => setSiteConfig({ ...siteConfig, logoType: val })}
                    />
                  </FormField>
                  <FormField label="Deskripsi / Slogan Yayasan">
                    <Input
                      type="text"
                      required
                      value={siteConfig.siteDesc}
                      onChange={(e) => setSiteConfig({ ...siteConfig, siteDesc: e.target.value })}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Favicon Yayasan / Situs">
                    <ImagePicker
                      value={siteConfig.faviconUrl || null}
                      onChange={(val) => setSiteConfig({ ...siteConfig, faviconUrl: val || '' })}
                      showCamera={false}
                    />
                  </FormField>
                  <FormField label="Logo Yayasan">
                    <ImagePicker
                      value={siteConfig.logoUrl || null}
                      onChange={(val) => setSiteConfig({ ...siteConfig, logoUrl: val || '' })}
                      showCamera={false}
                    />
                  </FormField>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" className="px-6 py-3 cursor-pointer" leftIcon="save">
                    Simpan Identitas
                  </Button>
                </div>
              </form>
            </div>

            {/* Menu Navigasi */}
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
              <h3 className="font-bold text-sm text-on-surface">Manajemen Menu Navigasi Publik</h3>
              <p className="text-xs text-on-surface-variant font-semibold">
                Tautan menu navbar di atas pada halaman publik dapat ditambah/dihapus secara dinamis dari sini.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                  {navLinks.map((n) => (
                    <div key={n.id} className="flex justify-between items-center p-3 rounded-2xl bg-white border border-primary/10">
                      <div>
                        <p className="text-xs font-bold text-on-surface">{n.name}</p>
                        <p className="text-[10px] text-primary font-bold">{n.url}</p>
                      </div>
                      <button
                        onClick={() => {
                          setNavLinkToDelete(n);
                          setShowDeleteNavLinkModal(true);
                        }}
                        className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <Icon name="delete" className="text-base font-bold" />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddNavLink} className="space-y-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <h4 className="text-xs font-bold text-primary">Tambah Menu Baru</h4>
                  <FormField label="Nama Tampilan Menu">
                    <Input
                      type="text"
                      required
                      placeholder="Contoh: Laporan, FAQ"
                      value={newNavLinkName}
                      onChange={(e) => setNewNavLinkName(e.target.value)}
                    />
                  </FormField>
                  <FormField label="ID Anchor / URL">
                    <Input
                      type="text"
                      required
                      placeholder="Contoh: #buku-besar, /login"
                      value={newNavLinkUrl}
                      onChange={(e) => setNewNavLinkUrl(e.target.value)}
                    />
                  </FormField>
                  <Button type="submit" variant="primary" className="w-full py-2.5 cursor-pointer" leftIcon="add">
                    Simpan Menu
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Prioritas Sidebar */}
          <div className="space-y-6 text-left">
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
              <h3 className="font-bold text-sm text-on-surface">Urutan Navigasi Sidebar (Dashboard)</h3>
              <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed">
                Tentukan urutan menu sidebar di dashboard. Masukkan angka prioritas (1 = teratas, 2 = di bawahnya, dsb). Klik Simpan untuk menerapkan.
              </p>
              <form onSubmit={handleSaveSidebarOrder} className="space-y-3">
                <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                  {sidebarMenuItems.map((item, idx) => (
                    <div key={item.id} className="flex justify-between items-center p-2.5 rounded-2xl bg-white border border-primary/10 gap-3">
                      <div className="flex items-center gap-2">
                        <Icon name={item.icon} className="text-primary text-xs" />
                        <span className="text-xs font-bold text-on-surface">{item.name}</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-14 px-2 py-1.5 bg-surface-container-low border border-outline/10 rounded-xl text-center text-xs font-extrabold text-primary"
                        value={item.sort_order}
                        onChange={(e) => {
                          const updated = [...sidebarMenuItems];
                          updated[idx].sort_order = parseInt(e.target.value) || 0;
                          setSidebarMenuItems(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Button type="submit" variant="primary" className="w-full py-2.5 cursor-pointer" leftIcon="save">
                  Simpan Urutan Sidebar
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Struktur Keuangan & Tutup Buku */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up text-left">
          {/* Kolom Kiri: Kategori Keuangan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kategori list */}
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
              <h3 className="font-bold text-sm text-on-surface">Kategori Transaksi Dinamis</h3>
              <p className="text-xs text-on-surface-variant font-semibold">
                Atur dropdown pilihan kategori transaksi pada form kas masuk dan kas keluar. Kategori penting sistem terproteksi otomatis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pemasukan Categories */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-primary flex items-center gap-1">
                    <Icon name="arrow_circle_down" className="text-sm" />
                    Kategori Pemasukan (Kas Masuk)
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
                    {categories.filter(c => c.tipe === 'in').map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-primary/5">
                        <span className="text-xs font-bold text-on-surface">{c.name}</span>
                        <button
                          onClick={() => {
                            setCategoryToDelete(c);
                            setShowDeleteCategoryModal(true);
                          }}
                          className="text-outline hover:text-error p-1 hover:bg-error/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icon name="delete" className="text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pengeluaran Categories */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-error flex items-center gap-1">
                    <Icon name="arrow_circle_up" className="text-sm" />
                    Kategori Pengeluaran (Kas Keluar)
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
                    {categories.filter(c => c.tipe === 'out').map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-error/5">
                        <span className="text-xs font-bold text-on-surface">{c.name}</span>
                        <button
                          onClick={() => {
                            setCategoryToDelete(c);
                            setShowDeleteCategoryModal(true);
                          }}
                          className="text-outline hover:text-error p-1 hover:bg-error/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Icon name="delete" className="text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Tambah Kategori */}
              <form onSubmit={handleAddCategory} className="border-t border-primary/10 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-primary/5 p-4 rounded-2xl">
                <FormField label="Nama Kategori Baru" className="md:col-span-1">
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Operasional Dapur"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </FormField>
                <FormField label="Jenis Arus Kas" className="md:col-span-1">
                  <Select
                    options={[
                      { value: 'in', label: 'Kas Masuk (Pemasukan)' },
                      { value: 'out', label: 'Kas Keluar (Pengeluaran)' },
                    ]}
                    value={newCategoryTipe}
                    onChange={(val) => setNewCategoryTipe(val as 'in' | 'out')}
                  />
                </FormField>
                <Button type="submit" variant="primary" className="w-full py-3 cursor-pointer" leftIcon="add">
                  Simpan Kategori
                </Button>
              </form>
            </div>

            {/* Tutup Buku Guidance Box */}
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-error/20 bg-error-container/5 space-y-4">
              <h3 className="font-extrabold text-sm text-error flex items-center gap-1.5">
                <Icon name="lock" className="text-base text-error" />
                Modul Tutup Buku Periode
              </h3>
              
              <div className="space-y-4 text-xs font-semibold text-on-surface-variant leading-relaxed">
                <p>
                  Tutup buku membekukan seluruh catatan transaksi kas masuk, kas keluar, dan mutasi saldo berjalan. Tindakan ini <strong>tidak dapat diurungkan</strong> setelah disubmit.
                </p>

                <CollapsibleGuide title="Panduan Kapan & Cara Tutup Buku" icon="help_outline" defaultOpen={false} className="border-error/20">
                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-error">📌 Kapan Anda HARUS Melakukan Tutup Buku?</h4>
                      <ul className="list-disc pl-4 space-y-1 font-semibold text-[11px]">
                        <li><strong>Akhir Tahun Buku (Tahunan)</strong>: Setiap akhir tahun ajaran pondok pesantren atau akhir tahun kalender untuk pelaporan Audit resmi.</li>
                        <li><strong>Serah Terima Jabatan</strong>: Saat terjadi pergantian bendahara/kepengurusan baru untuk mengunci kas awal.</li>
                        <li><strong>Audit Selesai</strong>: Ketika seluruh data pembukuan periode berjalan dinyatakan bersih dan disetujui Pengawas Yayasan.</li>
                      </ul>
                    </div>

                    <div className="space-y-1 border-t border-outline/10 pt-3">
                      <h4 className="font-bold text-xs text-tertiary">⚠️ Kapan Anda JANGAN Melakukan Tutup Buku?</h4>
                      <ul className="list-disc pl-4 space-y-1 font-semibold text-[11px]">
                        <li><strong>Masih Ada Koreksi</strong>: Masih ada bukti kuitansi fisik yang belum diunggah atau ada salah input nominal yang belum disunting.</li>
                        <li><strong>Hanya Ingin Ganti Bulan</strong>: Jangan lakukan tutup buku hanya karena ingin ganti bulan. Cukup gunakan filter bulan/tahun di halaman Laporan Keuangan.</li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleGuide>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTutupBukuModal(true)}
                  className="px-5 py-3 bg-error text-white font-extrabold text-xs rounded-2xl hover:brightness-105 active:scale-95 transition-all shadow-md shadow-error/20 cursor-pointer flex items-center gap-2"
                >
                  <Icon name="history_edu" className="text-base" />
                  Mulai Prosedur Tutup Buku
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Kelas Santri */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
              <h3 className="font-bold text-sm text-on-surface">Data Kelas Santri</h3>
              <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed">
                Menambah atau menghapus kelas dinamis santri di IKWAS.
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {classes.map((k) => (
                  <div key={k.id} className="flex justify-between items-center p-2.5 px-3 rounded-xl bg-white border border-primary/10">
                    <div className="flex items-center gap-2">
                      <Icon name="school" className="text-primary text-xs" />
                      <span className="text-xs font-bold text-on-surface">{k.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setKelasToDelete(k);
                        setShowDeleteKelasModal(true);
                      }}
                      className="text-outline hover:text-error p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Icon name="delete" className="text-base" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddKelas} className="border-t border-primary/10 pt-4 space-y-3">
                <FormField label="Nama Kelas Baru">
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Tahfidz Al-Furqon 1"
                    value={newKelasName}
                    onChange={(e) => setNewKelasName(e.target.value)}
                  />
                </FormField>
                <Button type="submit" variant="primary" className="w-full py-2.5 cursor-pointer" leftIcon="add">
                  Tambah Kelas
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Pengaturan Halaman CMS Header */}
      {activeTab === 'headers' && (
        <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 max-w-2xl mx-auto space-y-6 animate-fade-in-up">
          <div>
            <h3 className="font-bold text-sm text-on-surface">Kustomisasi Heading &amp; Deskripsi Halaman</h3>
            <p className="text-xs text-on-surface-variant font-semibold leading-relaxed mt-1">
              Ubah teks banner heading, sub-slogan, serta tag sorot pada setiap halaman dashboard secara realtime.
            </p>
          </div>

          <div className="space-y-4">
            <FormField label="Pilih Halaman Target">
              <Select
                options={dashboardPages}
                value={selectedPath}
                onChange={setSelectedPath}
              />
            </FormField>

            <form onSubmit={handleSavePageHeader} className="space-y-4 pt-4 border-t border-primary/10 text-left">
              <FormField label="Tag Sorot / Badge Halaman (Highlight)">
                <Input
                  type="text"
                  placeholder="Contoh: Kas Masuk, Modul Wadiah, dsb..."
                  value={pageHeaderForm.badge}
                  onChange={(e) => setPageHeaderForm({ ...pageHeaderForm, badge: e.target.value })}
                />
              </FormField>

              <FormField label="Judul Utama Halaman (Heading)">
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Buku Tabungan Santri"
                  value={pageHeaderForm.title}
                  onChange={(e) => setPageHeaderForm({ ...pageHeaderForm, title: e.target.value })}
                />
              </FormField>

              <FormField label="Sub-slogan / Deskripsi Penjelasan Halaman">
                <textarea
                  rows={3}
                  className="w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:bg-white transition-all text-xs font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
                  placeholder="Tulis penjelasan singkat mengenai peruntukan halaman ini..."
                  value={pageHeaderForm.description}
                  onChange={(e) => setPageHeaderForm({ ...pageHeaderForm, description: e.target.value })}
                ></textarea>
              </FormField>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" className="px-6 py-3 cursor-pointer" leftIcon="save">
                  Simpan Desain Heading
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

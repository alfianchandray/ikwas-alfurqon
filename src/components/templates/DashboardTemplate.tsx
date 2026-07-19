import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNav from '../organisms/SidebarNav';
import BottomNav from '../organisms/BottomNav';
import Icon from '../atoms/Icon';
import ConfirmationModal from '../organisms/ConfirmationModal';

interface DashboardTemplateProps {
  children: React.ReactNode;
}

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

export default function DashboardTemplate({ children }: DashboardTemplateProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [siteName, setSiteName] = useState('IKWAS Al-Furqon');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: 'Beranda', path: '/dashboard', icon: 'dashboard' },
    { name: 'Pemasukan', path: '/dashboard/pemasukan', icon: 'arrow_circle_down' },
    { name: 'Pengeluaran', path: '/dashboard/pengeluaran', icon: 'arrow_circle_up' },
    { name: 'Iuran & Tagihan', path: '/dashboard/santri', icon: 'group' },
    { name: 'Buku Tabungan', path: '/dashboard/tabungan', icon: 'account_balance_wallet' },
    { name: 'Laporan Keuangan', path: '/dashboard/laporan', icon: 'description' },
    { name: 'Pengguna', path: '/dashboard/pengguna', icon: 'manage_accounts' },
  ]);

  useEffect(() => {
    // Dynamic Brand
    const savedConfig = localStorage.getItem('ikwas_site_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.siteName) setSiteName(config.siteName);
    }

    // Dynamic Sidebar Menu
    fetch('/api/sidebar-menu')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ikwas_user');
    }
    setIsLoading(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Custom loading indicator overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center text-white select-none">
          <div className="flex flex-col items-center gap-3">
            <Icon name="sync" className="animate-spin text-4xl text-primary" />
            <span className="text-xs font-bold tracking-widest text-white/90">Memproses Keluar...</span>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Konfirmasi Keluar"
        message={`Apakah Anda yakin ingin keluar dari sesi portal internal saat ini?`}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmText="Keluar"
        cancelText="Batal"
        variant="primary"
      />

      {/* Desktop Sidebar Nav Organism */}
      <SidebarNav menuItems={menuItems} onLogout={() => setShowLogoutModal(true)} />

      {/* Mobile Top Header (100% custom) */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <Icon name="account_balance" className="text-primary text-2xl font-bold" fill={true} />
          <span className="font-extrabold text-sm text-primary tracking-tight">{siteName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard/pengaturan')}
            className="p-2 rounded-xl bg-surface-container text-on-surface hover:bg-primary/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Icon name="settings" className="text-base" />
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 rounded-xl bg-error-container text-error hover:bg-error/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Icon name="logout" className="text-base" />
          </button>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden pb-24 md:pb-0">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-10 py-6 bg-white/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 select-none">
          <div>
            <h2 className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Sistem Portal Keuangan &bull; Koneksi Terenkripsi SSL
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center gap-2">
              <Icon name="event" className="text-xs font-bold" />
              Hari Ini: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-grow p-4 md:p-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav Organism */}
      <BottomNav menuItems={menuItems} />
    </div>
  );
}

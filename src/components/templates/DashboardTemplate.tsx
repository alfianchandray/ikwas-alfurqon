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

const colorMap: Record<string, { primary: string; dark: string; container: string }> = {
  teal: { primary: '#0D9488', dark: '#0B7A70', container: '#008378' },
  emerald: { primary: '#059669', dark: '#047857', container: '#064e3b' },
  gold: { primary: '#D97706', dark: '#B45309', container: '#78350f' },
  indigo: { primary: '#4F46E5', dark: '#3730A3', container: '#1e1b4b' },
};

export default function DashboardTemplate({ children }: DashboardTemplateProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [siteName, setSiteName] = useState('IKWAS Al-Furqon');
  const [themeColor, setThemeColor] = useState('teal');
  const [logoType, setLogoType] = useState('mosque');
  const [authChecked, setAuthChecked] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: 'Beranda', path: '/dashboard', icon: 'dashboard' },
    { name: 'Pemasukan', path: '/dashboard/pemasukan', icon: 'arrow_circle_down' },
    { name: 'Pengeluaran', path: '/dashboard/pengeluaran', icon: 'arrow_circle_up' },
    { name: 'Iuran & Tagihan', path: '/dashboard/santri', icon: 'group' },
    { name: 'Buku Tabungan', path: '/dashboard/tabungan', icon: 'account_balance_wallet' },
    { name: 'Laporan Keuangan', path: '/dashboard/laporan', icon: 'description' },
    { name: 'Pengguna', path: '/dashboard/pengguna', icon: 'manage_accounts' },
  ]);

  // Auth guard — replaces proxy.ts edge middleware
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    // Dynamic Brand
    const savedConfig = localStorage.getItem('ikwas_site_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.siteName) setSiteName(config.siteName);
      if (config.themeColor) setThemeColor(config.themeColor);
      if (config.logoType) setLogoType(config.logoType);
    }

    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && !data.error) {
          if (data.site_name) setSiteName(data.site_name);
          if (data.theme_color) setThemeColor(data.theme_color);
          if (data.logo_type) setLogoType(data.logo_type);
          localStorage.setItem('ikwas_site_config', JSON.stringify({
            siteName: data.site_name,
            themeColor: data.theme_color,
            logoType: data.logo_type,
          }));
        }
      })
      .catch(() => {});

    // Dynamic Sidebar Menu
    fetch('/api/sidebar-menu')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
          localStorage.setItem('ikwas_sidebar_menu', JSON.stringify(data));
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

  const colors = colorMap[themeColor] || colorMap.teal;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-xs font-extrabold text-primary">
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --color-primary: ${colors.primary} !important;
            --color-primary-dark: ${colors.dark} !important;
            --color-primary-container: ${colors.container} !important;
          }
        `}} />
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-spin">
          <Icon name="sync" className="text-xl" />
        </div>
        Memverifikasi sesi pengurus...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background font-sans relative">
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --color-primary: ${colors.primary} !important;
          --color-primary-dark: ${colors.dark} !important;
          --color-primary-container: ${colors.container} !important;
        }
      `}} />
      
      {/* Custom loading indicator overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-[9999] flex flex-col items-center justify-center gap-2 text-xs font-bold text-white select-none">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-spin border border-primary/20">
            <Icon name="sync" className="text-xl text-primary" />
          </div>
          Memproses...
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
      <SidebarNav menuItems={menuItems} onLogout={() => setShowLogoutModal(true)} logoType={logoType} />

      {/* Mobile Top Header (100% custom) */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <Icon 
            name={logoType === 'crescent' ? 'brightness_3' : logoType === 'star' ? 'grade' : 'account_balance'} 
            className="text-primary text-2xl font-bold" 
            fill={true} 
          />
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

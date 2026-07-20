'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '../atoms/Icon';

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

interface SidebarNavProps {
  menuItems: MenuItem[];
  onLogout: () => void;
  logoType?: string;
}

interface CurrentUser {
  name: string;
  username: string;
  role: string;
}

export default function SidebarNav({ menuItems, onLogout, logoType = 'mosque' }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [siteName, setSiteName] = useState('IKWAS Al-Furqon');
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    name: 'Pengurus',
    username: '...',
    role: 'Admin',
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUser = () => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ikwas_user') : null;
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUser({ name: user.name || 'Pengurus', username: user.username || '', role: user.role || 'Admin' });
      } catch {}
    } else {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.user) {
            setCurrentUser({ name: data.user.name, username: data.user.username, role: data.user.role });
            sessionStorage.setItem('ikwas_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    // Load site name from API
    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.site_name) setSiteName(data.site_name);
      })
      .catch(() => {
        const savedConfig = localStorage.getItem('ikwas_site_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.siteName) setSiteName(config.siteName);
        }
      });

    loadUser();

    // Load minimized status
    const minState = localStorage.getItem('ikwas_sidebar_minimized') === 'true';
    setIsMinimized(minState);

    // Listen to storage events to reload user details if updated
    window.addEventListener('storage', loadUser);

    // Click outside listener
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('storage', loadUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    localStorage.setItem('ikwas_sidebar_minimized', String(nextState));
    // Trigger global event for template resizing
    window.dispatchEvent(new Event('sidebar-resize'));
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout(); // trigger parent confirmation modal first
  };

  // Get initials from name
  const initials = currentUser.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside
      className={`hidden md:flex flex-col transition-all duration-300 ease-in-out glass-card border-r border-primary/10 h-screen sticky top-0 z-40 select-none flex-shrink-0 ${
        isMinimized ? 'w-20 p-4' : 'w-72 p-6'
      }`}
    >
      {/* Brand */}
      <div className={`flex items-center gap-2 mb-10 px-2 justify-between ${isMinimized ? 'flex-col gap-4' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 flex-shrink-0">
            <Icon 
              name={logoType === 'crescent' ? 'brightness_3' : logoType === 'star' ? 'grade' : 'account_balance'} 
              className="text-xl" 
              fill={true} 
            />
          </div>
          {!isMinimized && (
            <div className="transition-opacity duration-200">
              <h1 className="font-extrabold text-sm text-primary leading-tight truncate max-w-[150px]">{siteName}</h1>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Internal Portal</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleMinimize}
          className="p-1.5 text-outline hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-primary/5 flex items-center justify-center flex-shrink-0"
          title={isMinimized ? "Perbesar Sidebar" : "Perkecil Sidebar"}
        >
          <Icon name={isMinimized ? "chevron_right" : "chevron_left"} className="text-base" />
        </button>
      </div>

      {/* Menu Links */}
      <nav className="flex-grow space-y-1.5 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              title={isMinimized ? item.name : undefined}
              className={`flex items-center rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                isMinimized ? 'justify-center p-3 gap-0' : 'px-4 py-3.5 gap-4'
              } ${
                isActive
                  ? 'primary-gradient text-white shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <Icon
                name={item.icon}
                className={`text-lg ${isActive ? 'text-white' : 'text-outline group-hover:text-primary'} ${isMinimized ? '' : 'flex-shrink-0'}`}
                fill={isActive}
              />
              {!isMinimized && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Settings & Profile */}
      <div className="border-t border-primary/10 pt-6 space-y-3">
        {/* Settings */}
        <Link
          href="/dashboard/pengaturan"
          title={isMinimized ? "Pengaturan Situs" : undefined}
          className={`flex items-center rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
            isMinimized ? 'justify-center p-3 gap-0' : 'px-4 py-3 gap-4'
          } ${
            pathname === '/dashboard/pengaturan'
              ? 'bg-tertiary-container text-on-tertiary-container shadow-sm scale-[1.02]'
              : 'text-on-surface-variant hover:bg-tertiary/10 hover:text-tertiary'
          }`}
        >
          <Icon
            name="settings"
            className={`text-lg ${
              pathname === '/dashboard/pengaturan' ? 'text-on-tertiary-container' : 'text-outline group-hover:text-tertiary'
            } ${isMinimized ? '' : 'flex-shrink-0'}`}
            fill={pathname === '/dashboard/pengaturan'}
          />
          {!isMinimized && <span>Pengaturan Situs</span>}
        </Link>

        {/* Profile Card / Custom Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center w-full p-2 rounded-2xl hover:bg-primary/5 transition-all text-left cursor-pointer ${
              isMinimized ? 'justify-center' : 'justify-between'
            }`}
            title={isMinimized ? currentUser.name : undefined}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm flex-shrink-0">
                {initials || 'SA'}
              </div>
              {!isMinimized && (
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-on-surface truncate max-w-[110px]">{currentUser.name}</h4>
                  <p className="text-[10px] text-primary font-bold">{currentUser.role}</p>
                </div>
              )}
            </div>
            {!isMinimized && (
              <Icon name="expand_more" className={`text-outline text-lg transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {showDropdown && (
            <div
              className={`absolute bg-white rounded-2xl shadow-xl border border-primary/10 p-2 z-50 animate-fade-in-up ${
                isMinimized ? 'bottom-2 left-20 w-52 ml-2' : 'bottom-14 left-0 w-full'
              }`}
            >
              <div className="px-4 py-2 border-b border-surface mb-1">
                <p className="text-[10px] text-outline font-bold">Login sebagai</p>
                <p className="text-xs font-extrabold text-on-surface truncate">@{currentUser.username}</p>
              </div>
              <Link
                href="/dashboard/akun"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer mb-1"
              >
                <Icon name="manage_accounts" className="text-base" />
                Pengaturan Akun
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
              >
                <Icon name="logout" className="text-base" />
                Keluar / Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

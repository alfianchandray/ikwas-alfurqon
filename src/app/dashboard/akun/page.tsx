'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import Toast from '@/components/molecules/Toast';

export default function AkunPage() {
  // Profile state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Admin');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  useEffect(() => {
    // Load current user from session or API
    const stored = sessionStorage.getItem('ikwas_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setName(user.name || '');
        setUsername(user.username || '');
        setRole(user.role || 'Admin');
      } catch {}
    } else {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.user) {
            setName(data.user.name);
            setUsername(data.user.username);
            setRole(data.user.role);
            sessionStorage.setItem('ikwas_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      setToastMessage('Nama dan Username wajib diisi!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username }),
      });

      const data = await res.json() as any;
      setIsLoadingProfile(false);

      if (res.ok) {
        setToastMessage(data.message || 'Profil berhasil diperbarui.');
        setToastType('success');
        setShowToast(true);

        // Update local session
        const stored = sessionStorage.getItem('ikwas_user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.name = name;
            user.username = username.toLowerCase();
            sessionStorage.setItem('ikwas_user', JSON.stringify(user));
            // Trigger storage event to notify SidebarNav
            window.dispatchEvent(new Event('storage'));
          } catch {}
        }
      } else {
        setToastMessage(data.error || 'Gagal memperbarui profil.');
        setToastType('error');
        setShowToast(true);
      }
    } catch {
      setIsLoadingProfile(false);
      setToastMessage('Terjadi kesalahan koneksi server.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setToastMessage('Semua kolom password wajib diisi!');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (newPassword.length < 8) {
      setToastMessage('Password baru minimal 8 karakter!');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastMessage('Konfirmasi password tidak cocok!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsLoadingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const data = await res.json() as any;
      setIsLoadingPassword(false);

      if (res.ok) {
        setToastMessage(data.message || 'Password berhasil diperbarui.');
        setToastType('success');
        setShowToast(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToastMessage(data.error || 'Gagal memperbarui password.');
        setToastType('error');
        setShowToast(true);
      }
    } catch {
      setIsLoadingPassword(false);
      setToastMessage('Terjadi kesalahan pada server.');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="space-y-10 text-left">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <div>
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2 inline-block">Akun Pengurus</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Pengaturan Akun</h1>
        <p className="text-xs md:text-sm text-on-surface-variant font-semibold">
          Perbarui nama lengkap, username login, serta kelola kata sandi akun pribadi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Profil */}
        <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
          <div className="flex items-center gap-3 border-b border-primary/10 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="person" className="text-xl" fill={true} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Data Profil Pribadi</h3>
              <p className="text-[10px] text-on-surface-variant font-semibold">Hak akses Anda saat ini: {role}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <FormField label="Nama Lengkap Pengurus">
              <Input
                type="text"
                required
                placeholder="Masukkan nama lengkap..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Username Login">
              <Input
                type="text"
                required
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormField>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="px-6 py-3 cursor-pointer"
                leftIcon="save"
                disabled={isLoadingProfile}
              >
                {isLoadingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </div>
          </form>
        </div>

        {/* Card 2: Password */}
        <div className="glass-card rounded-3xl p-6 shadow-sm border border-white/20 space-y-4">
          <div className="flex items-center gap-3 border-b border-primary/10 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-error-container/20 flex items-center justify-center text-error">
              <Icon name="lock" className="text-xl" fill={true} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Ubah Kata Sandi</h3>
              <p className="text-[10px] text-on-surface-variant font-semibold">Perbarui password Anda secara berkala demi keamanan.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <FormField label="Kata Sandi Lama">
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </FormField>

            <FormField label="Kata Sandi Baru">
              <Input
                type="password"
                required
                placeholder="Min. 8 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>

            <FormField label="Konfirmasi Kata Sandi Baru">
              <Input
                type="password"
                required
                placeholder="Ulangi kata sandi baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormField>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="px-6 py-3 cursor-pointer"
                leftIcon="vpn_key"
                disabled={isLoadingPassword}
              >
                {isLoadingPassword ? 'Menyimpan...' : 'Perbarui Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

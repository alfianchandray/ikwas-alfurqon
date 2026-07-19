'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Checkbox from '@/components/atoms/Checkbox';

export default function LoginPage() {
  const [siteName, setSiteName] = useState('IKWAS Al-Furqon');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('ikwas_site_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.siteName) setSiteName(config.siteName);
    }
  }, []);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Username dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, rememberMe }),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        setErrorMessage(data.error || 'Login gagal. Periksa kembali username dan password Anda.');
        return;
      }

      // Store minimal user info in sessionStorage for UI (not for auth — auth uses HttpOnly cookie)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ikwas_user', JSON.stringify(data.user));
      }

      router.push('/dashboard');
    } catch {
      setErrorMessage('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z' fill='%230D9488' fill-opacity='0.15'/%3E%3C/svg%3E\")",
        backgroundSize: '400px 400px'
      }}></div>
      <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>

      {/* Main Login Canvas */}
      <main className="w-full max-w-[440px] z-10 transition-all duration-700 ease-out select-none">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark mb-6 group transition-colors"
        >
          <Icon name="arrow_back" className="text-sm group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda
        </Link>

        {/* Brand Identity */}
        <div className="text-center mb-10 select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20 relative">
            {/* Islamic Star Pattern SVG Logo */}
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(0 12 12)" />
              <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" />
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-primary mb-1">{siteName}</h1>
          <p className="text-xs text-on-surface-variant font-semibold">Manajemen Keuangan Santri &amp; Lembaga</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-[2rem] p-10 shadow-lg border border-white/30">
          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold text-on-surface">Selamat Datang</h2>
            <p className="text-xs text-on-surface-variant font-semibold">Silakan masuk dengan akun Anda</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <Icon name="error" className="text-base" />
              {errorMessage}
            </div>
          )}

          <form className="space-y-6 text-left" onSubmit={handleLogin}>
            {/* Username Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant ml-1 block pb-0.5" htmlFor="username">
                Username atau Email
              </label>
              <div className="relative group">
                <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg" />
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="Masukkan username" 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant ml-1 block pb-0.5" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-lg" />
                <Input 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-12 pr-12"
                />
                <button 
                  aria-label="Toggle password visibility" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-primary transition-colors flex items-center justify-center" 
                  onClick={() => setShowPassword(!showPassword)} 
                  type="button"
                  disabled={isLoading}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-xl" fill={showPassword} />
                </button>
              </div>
            </div>

            {/* Action Items */}
            <div className="flex items-center justify-between pt-sm">
              <Checkbox 
                checked={rememberMe}
                onChange={setRememberMe}
                label="Ingat saya"
                disabled={isLoading}
              />
              <a className="text-xs font-bold text-primary hover:underline transition-all" href="#">Lupa password?</a>
            </div>

            {/* Login Button */}
            <Button 
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-4 mt-4"
              rightIcon={!isLoading ? 'arrow_forward' : undefined}
            >
              Masuk
            </Button>
          </form>
        </div>

        {/* Footer Decoration */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Aman • Transparan • Berkah</p>
          <div className="flex justify-center items-center gap-8 opacity-30">
            <div className="w-24 h-[1px] bg-outline"></div>
            <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            </div>
            <div className="w-24 h-[1px] bg-outline"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

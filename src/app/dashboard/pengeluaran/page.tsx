'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PengeluaranRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/pemasukan?type=out');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-on-surface-variant">
        Mengarahkan ke Pencatatan Kas Keluar...
      </p>
    </div>
  );
}

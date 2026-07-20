'use client';

import React from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.22s ease-out both !important;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both !important;
        }
      `}} />
      <DashboardTemplate>{children}</DashboardTemplate>
    </>
  );
}

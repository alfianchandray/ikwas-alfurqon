'use client';

import React from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardTemplate>{children}</DashboardTemplate>;
}

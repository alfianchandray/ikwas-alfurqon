'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../atoms/Icon';

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

interface BottomNavProps {
  menuItems: MenuItem[];
}

export default function BottomNav({ menuItems }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-2xl border-t border-primary/10 z-40 shadow-lg select-none">
      <div className="flex overflow-x-auto no-scrollbar items-center py-1.5 px-2 gap-0.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/dashboard/pemasukan' && pathname.startsWith('/dashboard/pemasukan'));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-150 flex-shrink-0 min-w-[64px] ${
                isActive ? 'text-primary' : 'text-on-surface-variant opacity-75'
              }`}
            >
              <Icon
                name={item.icon}
                className="text-lg"
                fill={isActive}
              />
              <span className="text-[9px] font-bold tracking-tight whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

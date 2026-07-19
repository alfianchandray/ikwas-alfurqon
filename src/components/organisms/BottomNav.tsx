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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-2xl border-t border-primary/10 px-sm py-2 z-40 flex justify-around items-center shadow-lg select-none">
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 ${
              isActive ? 'text-primary' : 'text-on-surface-variant opacity-75'
            }`}
          >
            <Icon
              name={item.icon}
              className="text-lg"
              fill={isActive}
            />
            <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

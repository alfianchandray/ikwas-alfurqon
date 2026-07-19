'use client';

import React, { useState, useEffect } from 'react';
import Icon from '../atoms/Icon';

interface CollapsibleGuideProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  className?: string;
}

export default function CollapsibleGuide({
  title,
  children,
  defaultOpen = false,
  icon = 'info',
  className = '',
}: CollapsibleGuideProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Load user preference for keeping it open/closed from localStorage if needed (optional)
  // Let's keep it simple with state

  return (
    <div className={`glass-card rounded-3xl shadow-sm border border-white/20 overflow-hidden transition-all duration-200 ${className}`}>
      {/* Header (Toggle Button) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left font-bold text-xs text-on-surface uppercase tracking-wider hover:bg-primary/5 transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-2">
          <Icon name={icon} className="text-base text-primary" />
          {title}
        </span>
        <Icon
          name="expand_more"
          className={`text-outline transition-transform duration-200 text-lg ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[1000px] opacity-100 border-t border-primary/5 p-6 bg-primary/5' : 'max-h-0 opacity-0 p-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

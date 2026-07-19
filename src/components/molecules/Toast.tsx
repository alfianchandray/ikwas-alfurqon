'use client';

import React, { useEffect } from 'react';
import Icon from '../atoms/Icon';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  let bgClass = '';
  let iconName = '';
  let textClass = '';

  switch (type) {
    case 'success':
      bgClass = 'bg-primary text-white';
      iconName = 'check_circle';
      textClass = 'text-white';
      break;
    case 'error':
      bgClass = 'bg-error text-white';
      iconName = 'error';
      textClass = 'text-white';
      break;
    case 'warning':
      bgClass = 'bg-tertiary-container text-on-tertiary-container border border-tertiary/20';
      iconName = 'warning';
      textClass = 'text-on-tertiary-container';
      break;
    case 'info':
      bgClass = 'bg-white border border-primary/10 text-on-surface';
      iconName = 'info';
      textClass = 'text-on-surface';
      break;
  }

  return (
    <div className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl animate-fade-in-up transition-all ${bgClass}`}>
      <Icon name={iconName} className="text-xl" fill={true} />
      <span className={`text-xs font-bold ${textClass}`}>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-80 flex items-center justify-center p-0.5 rounded-full hover:bg-white/10"
      >
        <Icon name="close" className="text-sm font-bold" />
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import Input from '../atoms/Input';
import { terbilang } from '@/lib/terbilang';

interface SmartCurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  showTerbilang?: boolean;
}

export default function SmartCurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  error = false,
  className = '',
  id,
  showTerbilang = true,
}: SmartCurrencyInputProps) {
  const formatRupiah = (val: string) => {
    let clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(clean));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatRupiah(rawVal);
    onChange(formatted);
  };

  const numericVal = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  const verbalText = showTerbilang && numericVal > 0 ? terbilang(numericVal) : '';

  return (
    <div className={`relative group space-y-1.5 ${className}`}>
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold transition-colors select-none ${
          error ? 'text-error' : 'text-primary/60 group-focus-within:text-primary'
        }`}>
          Rp
        </span>
        <Input
          id={id}
          type="text"
          className="pl-12"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          error={error}
        />
      </div>

      {verbalText && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 animate-fade-in-up">
          <span className="select-none">💬 Terbilang:</span>
          <span className="italic">{verbalText}</span>
        </div>
      )}
    </div>
  );
}

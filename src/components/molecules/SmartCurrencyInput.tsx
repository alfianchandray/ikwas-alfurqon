'use client';

import React from 'react';
import Input from '../atoms/Input';

interface SmartCurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
}

export default function SmartCurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  error = false,
  className = '',
  id,
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

  return (
    <div className={`relative group ${className}`}>
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
  );
}

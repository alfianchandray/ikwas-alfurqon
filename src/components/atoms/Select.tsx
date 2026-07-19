'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Select Box Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex justify-between items-center px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl transition-all text-xs font-bold text-on-surface outline-none text-left select-none ${
          isOpen ? 'ring-2 ring-primary ring-offset-4 bg-white' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={selectedOption ? 'text-on-surface' : 'text-on-surface-variant/40'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          name="expand_more"
          className={`text-outline transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {/* Custom Dropdown popover list */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-primary/10 max-h-60 overflow-y-auto z-50 animate-fade-in-up no-scrollbar">
          {options.length > 0 ? (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-4 py-3 border-b border-surface-container/30 last:border-none text-xs font-bold transition-all duration-150 flex items-center justify-between hover:bg-primary/5 cursor-pointer ${
                    isSelected ? 'bg-primary/10 text-primary' : 'text-on-surface'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Icon name="check" className="text-primary text-base font-bold" />}
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-on-surface-variant font-medium">
              Tidak ada pilihan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

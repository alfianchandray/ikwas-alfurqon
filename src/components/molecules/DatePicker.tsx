'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '../atoms/Icon';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_SHORT_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function DatePicker({
  value,
  onChange,
  disabled = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get starting day index of the month: 0 = Mon, 1 = Tue, ... 6 = Sun
  const firstDayIndex = (() => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  })();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(year, month, day);
    // Format YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const formatDisplayDate = (val: string) => {
    if (!val) return 'Pilih Tanggal';
    const dateObj = new Date(val);
    const d = dateObj.getDate();
    const m = MONTHS_ID[dateObj.getMonth()].substring(0, 3);
    const y = dateObj.getFullYear();
    return `${d} ${m} ${y}`;
  };

  // Generate calendar grid array
  const calendarDays: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Active check
  const isSelected = (day: number) => {
    if (!value) return false;
    const valDate = new Date(value);
    return (
      valDate.getDate() === day &&
      valDate.getMonth() === month &&
      valDate.getFullYear() === year
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Date trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex justify-between items-center px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl transition-all text-xs font-bold text-on-surface outline-none text-left select-none ${
          isOpen ? 'ring-2 ring-primary ring-offset-4 bg-white' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={value ? 'text-on-surface' : 'text-on-surface-variant/40'}>
          {formatDisplayDate(value)}
        </span>
        <Icon
          name="calendar_today"
          className={`text-outline text-base ${isOpen ? 'text-primary' : ''}`}
        />
      </button>

      {/* Custom Calendar Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 bg-white rounded-3xl shadow-2xl border border-primary/10 p-4 w-72 z-50 animate-fade-in-up">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-primary/5 text-primary flex items-center justify-center transition-colors"
            >
              <Icon name="chevron_left" className="text-base font-bold" />
            </button>
            <span className="text-xs font-extrabold text-on-surface select-none">
              {MONTHS_ID[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-primary/5 text-primary flex items-center justify-center transition-colors"
            >
              <Icon name="chevron_right" className="text-base font-bold" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_SHORT_ID.map((day) => (
              <span key={day} className="text-[10px] font-bold text-on-surface-variant/50 select-none">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const active = isSelected(day);
              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`aspect-square w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                    active
                      ? 'primary-gradient text-white shadow-md shadow-primary/10'
                      : 'text-on-surface hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

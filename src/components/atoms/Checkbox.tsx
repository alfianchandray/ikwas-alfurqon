import React from 'react';
import Icon from './Icon';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: CheckboxProps) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} group select-none`}>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="peer hidden"
          disabled={disabled}
        />
        <div className={`w-5 h-5 rounded-lg border-2 ${
          checked
            ? 'bg-primary border-primary'
            : 'border-outline group-hover:border-primary'
        } transition-all duration-200 flex items-center justify-center`}>
          <Icon
            name="check"
            className={`text-white text-[12px] font-bold transition-opacity duration-200 ${
              checked ? 'opacity-100' : 'opacity-0'
            }`}
            fill={true}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}

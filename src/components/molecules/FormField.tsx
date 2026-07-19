import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export default function FormField({
  label,
  error,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-2 flex flex-col ${className}`}>
      <label className="text-xs font-bold text-on-surface-variant ml-1 select-none">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[10px] font-bold text-error ml-1 animate-fade-in-up">
          {error}
        </span>
      )}
    </div>
  );
}

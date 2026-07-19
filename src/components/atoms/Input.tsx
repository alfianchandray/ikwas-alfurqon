import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function Input({ className = '', error = false, ...props }: InputProps) {
  return (
    <input
      className={`w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-2xl focus:ring-2 ${
        error ? 'focus:ring-error' : 'focus:ring-primary'
      } focus:ring-offset-4 focus:bg-white transition-all text-xs font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40 ${className}`}
      {...props}
    />
  );
}

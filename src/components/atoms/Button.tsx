import React from 'react';
import Icon from './Icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error';
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  let baseStyle = 'inline-flex items-center justify-center gap-2 font-bold text-xs tracking-wider rounded-2xl active:scale-[0.98] transition-all duration-200 outline-none select-none cursor-pointer disabled:cursor-not-allowed';
  let variantStyle = '';

  switch (variant) {
    case 'primary':
      variantStyle = 'primary-gradient text-white shadow-lg shadow-primary/20 hover:brightness-105 disabled:opacity-50';
      break;
    case 'secondary':
      variantStyle = 'bg-transparent border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-50';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent text-tertiary-fixed-dim hover:bg-tertiary/10 disabled:opacity-50';
      break;
    case 'error':
      variantStyle = 'bg-error text-white shadow-lg shadow-error/20 hover:brightness-105 disabled:opacity-50';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Icon name="sync" className="animate-spin text-lg" />
      ) : leftIcon ? (
        <Icon name={leftIcon} className="text-lg" />
      ) : null}
      
      {children}

      {!isLoading && rightIcon ? <Icon name={rightIcon} className="text-lg" /> : null}
    </button>
  );
}

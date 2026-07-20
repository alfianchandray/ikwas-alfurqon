'use client';

import React from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'error';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  let headerBg = variant === 'error' ? 'bg-error' : 'primary-gradient';
  let alertBg = variant === 'error' ? 'bg-error-container/10 border-error/10' : 'bg-primary/5 border-primary/10';
  let alertTextClass = variant === 'error' ? 'text-on-error-container' : 'text-primary';
  let alertIcon = variant === 'error' ? 'warning' : 'info';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[448px] max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar animate-fade-in-up border border-primary/10 text-left flex-shrink-0 min-w-[320px] md:min-w-[448px]">
        {/* Modal Header */}
        <div className={`p-6 ${headerBg} text-white flex justify-between items-center`}>
          <h3 className="font-bold text-sm select-none">{title}</h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-white/85 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Warning banner inside (only show for error variant to avoid scaring users on actions like logout) */}
          {variant === 'error' && (
            <div className={`flex gap-3 p-3 rounded-2xl border ${alertBg}`}>
              <Icon name={alertIcon} className="text-error" />
              <div>
                <h4 className="text-xs font-bold text-error">
                  Perhatian Tindakan
                </h4>
                <p className={`text-[10px] leading-relaxed font-semibold ${alertTextClass}`}>
                  Pastikan Anda benar-benar yakin dengan tindakan ini. Beberapa perubahan krusial tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === 'error' ? 'error' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
              className="flex-1 py-3"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

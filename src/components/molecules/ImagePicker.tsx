'use client';

import React, { useState, useRef } from 'react';
import Icon from '../atoms/Icon';

interface ImagePickerProps {
  value: string | null; // Base64 or local image URL
  onChange: (value: string | null) => void;
  disabled?: boolean;
  showCamera?: boolean;
}

export default function ImagePicker({
  value,
  onChange,
  disabled = false,
  showCamera = true,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya diperbolehkan mengunggah berkas gambar (PNG, JPG, JPEG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerSelect = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSimulateCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsLoadingSim(true);
    setTimeout(() => {
      setIsLoadingSim(false);
      // Simulate taking a photo of a receipt (using a mock high-quality receipt image URL or placeholder base64)
      const mockReceipt = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKlYIKoZEzFVXlm4xZm103kF-M1UyNcpwB5PE8jJ95b9CE-9jGEqbaiSmv39uY33sSM_a984OczA8uF-i89inkyR_7OZBOUFhLvy8pLBWPXXh0AZnBsa9Vlv0XIEqNFuuYAYiBLrK8gUPS2CHTcHj3ROuNEMOHCe_eg9oFxDiFrjNoHD0qHEHDpFeZ4ptpLJN1lQWAG02FQPPt34wGVem0HID4W7sA5gZYdoAolhe8ttoRPsbj8gQdBmhWDriALWkPAXgu8NGOgQc';
      onChange(mockReceipt);
    }, 1000);
  };

  const [isLoadingSim, setIsLoadingSim] = useState(false);

  return (
    <div className="space-y-4">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Custom Picker Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerSelect}
        className={`relative min-h-[160px] border-2 border-dashed rounded-3xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-4 text-center group ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant bg-[#F8FAFC]/50 hover:border-primary hover:bg-primary/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {value ? (
          <div className="absolute inset-2 bg-white rounded-2xl shadow-inner overflow-hidden flex items-center justify-center">
            <img
              className="max-h-full max-w-full object-contain"
              src={value}
              alt="Bukti Kuitansi"
            />
            <button
              onClick={handleRemove}
              className="absolute top-3 right-3 bg-error text-white p-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              type="button"
            >
              <Icon name="close" className="text-sm font-bold" />
            </button>
          </div>
        ) : (
          <div className="space-y-2 pointer-events-none select-none">
            <Icon
              name="cloud_upload"
              className="text-4xl text-outline group-hover:text-primary transition-colors"
            />
            <p className="text-xs font-bold text-on-surface">Klik atau Seret Kuitansi ke Sini</p>
            <p className="text-[10px] text-on-surface-variant font-semibold">Maksimal 5MB (JPG, PNG)</p>
          </div>
        )}
      </div>

      {/* Simulated camera capture button */}
      {!value && showCamera && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSimulateCamera}
            disabled={disabled || isLoadingSim}
            className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-xs font-bold shadow-sm border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingSim ? (
              <Icon name="sync" className="animate-spin text-sm" />
            ) : (
              <Icon name="photo_camera" className="text-sm" />
            )}
            {isLoadingSim ? 'Mengaktifkan Kamera...' : 'Ambil Foto Kuitansi'}
          </button>
        </div>
      )}
    </div>
  );
}

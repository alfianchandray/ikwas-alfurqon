import React from 'react';
import Icon from '../atoms/Icon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-primary/5 bg-white/20 select-none">
      {/* Page Size Selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-outline">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2.5 py-1 bg-surface-container border border-primary/10 rounded-xl outline-none font-bold text-xs text-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>data per halaman</span>
        </div>
      )}

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-primary/10 bg-white/40 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Halaman Sebelumnya"
        >
          <Icon name="chevron_left" className="text-sm font-bold" />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const page = idx + 1;
          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center ${
                isCurrent
                  ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-[1.05]'
                  : 'border border-primary/10 bg-white/40 text-outline hover:bg-primary/5 hover:text-primary'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-primary/10 bg-white/40 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Halaman Selanjutnya"
        >
          <Icon name="chevron_right" className="text-sm font-bold" />
        </button>
      </div>
    </div>
  );
}

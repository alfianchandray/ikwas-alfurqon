'use client';

import React, { useState, useMemo } from 'react';
import Icon from '../atoms/Icon';
import Select from '../atoms/Select';
import TableSkeleton from '../atoms/TableSkeleton';

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
}

interface DatatableProProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchKeys: (keyof T)[];
  categories?: { value: string; label: string }[];
  categoryKey?: keyof T;
  tipeKey?: keyof T;
  hideToolbarSearch?: boolean;
  externalSearchTerm?: string;
  isLoading?: boolean;
}

export default function DatatablePro<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Cari data...',
  searchKeys,
  categories = [],
  categoryKey,
  tipeKey,
  hideToolbarSearch = false,
  externalSearchTerm = '',
  isLoading = false,
}: DatatableProProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const activeSearchTerm = hideToolbarSearch ? externalSearchTerm : searchTerm;
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tipeFilter, setTipeFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search match
      const matchesSearch = searchKeys.some((k) => {
        const val = row[k];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(activeSearchTerm.toLowerCase());
      });

      // Category match
      const matchesCategory =
        categoryKey && categoryFilter ? String(row[categoryKey]) === categoryFilter : true;

      // Type match
      const matchesTipe =
        tipeKey && tipeFilter ? String(row[tipeKey]) === tipeFilter : true;

      return matchesSearch && matchesCategory && matchesTipe;
    });
  }, [data, searchTerm, categoryFilter, tipeFilter, searchKeys, categoryKey, tipeKey]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortBy as keyof T];
      const bVal = b[sortBy as keyof T];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedData, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter Select Options
  const typeOptions = [
    { value: '', label: 'Semua Aliran' },
    { value: 'in', label: 'Kas Masuk' },
    { value: 'out', label: 'Kas Keluar' },
  ];

  const categoryOptions = useMemo(() => {
    return [{ value: '', label: 'Semua Kategori' }, ...categories];
  }, [categories]);

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      {(!hideToolbarSearch || (categoryKey && categories.length > 0) || tipeKey) && (
        <div className="p-4 px-6 border-b border-white/20 bg-white/20 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          {!hideToolbarSearch && (
            <div className="flex items-center gap-2 bg-white/85 px-4 py-2.5 rounded-2xl border border-primary/10 w-full md:w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Icon name="search" className="text-primary text-lg" />
              <input
                type="text"
                className="bg-transparent border-none outline-none text-xs w-full placeholder:text-on-surface-variant/40 text-on-surface font-semibold"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

        {/* Filters (Using custom Select components!) */}
        <div className="flex gap-4 w-full md:w-auto items-center">
          {tipeKey && (
            <Select
              options={typeOptions}
              value={tipeFilter}
              onChange={(val) => {
                setTipeFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Aliran"
              className="w-full md:w-36"
            />
          )}

          {categoryKey && (
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Kategori"
              className="w-full md:w-44"
            />
          )}
        </div>
      </div>
      )}

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary/5 text-primary text-xs font-bold border-b border-primary/10 select-none">
              {columns.map((col) => {
                const isSortable = col.sortable;
                const isCurrentSort = sortBy === col.key;
                const alignClass =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={col.key}
                    onClick={() => isSortable && handleSort(col.key)}
                    className={`px-6 py-4 ${alignClass} ${
                      isSortable ? 'cursor-pointer hover:bg-primary/10 transition-colors' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {isSortable && (
                        <Icon
                          name={
                            isCurrentSort
                              ? sortOrder === 'asc'
                                ? 'arrow_upward'
                                : 'arrow_downward'
                              : 'unfold_more'
                          }
                          className="text-xs"
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <TableSkeleton rowCount={itemsPerPage} colCount={columns.length} />
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-primary/5 transition-colors duration-150">
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                    const cellContent = col.render ? col.render(row) : String(row[col.key as keyof T] || '-');
                    return (
                      <td key={col.key} className={`px-6 py-4 text-xs font-semibold ${alignClass}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-xs text-on-surface-variant font-semibold">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (custom styling, no browser defaults) */}
      {totalPages > 1 && (
        <div className="p-4 px-6 bg-surface-container-low/30 border-t border-white/20 flex justify-between items-center select-none">
          <span className="text-xs font-bold text-on-surface-variant">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 bg-white border border-primary/20 hover:border-primary rounded-xl text-xs font-bold text-primary disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 bg-white border border-primary/20 hover:border-primary rounded-xl text-xs font-bold text-primary disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

interface TableSkeletonProps {
  rowCount?: number;
  colCount?: number;
}

export default function TableSkeleton({ rowCount = 5, colCount = 4 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: colCount }).map((_, cIdx) => (
            <td key={cIdx} className="p-4 px-6">
              <div className="h-4 bg-primary/10 rounded-lg w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

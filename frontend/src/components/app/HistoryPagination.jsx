import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HistoryPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 select-none">
      {/* Items count summary */}
      <div>
        <span>
          Showing <strong className="text-slate-900">{startIdx}–{endIdx}</strong> of{' '}
          <strong className="text-slate-900">{totalItems}</strong> verifications
        </span>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`p-1.5 rounded-lg border transition-all ${
              currentPage <= 1
                ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-50 bg-white'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-2xs'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Number Buttons */}
          {pageNumbers.map((p) => {
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`p-1.5 rounded-lg border transition-all ${
              currentPage >= totalPages
                ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-50 bg-white'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-2xs'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

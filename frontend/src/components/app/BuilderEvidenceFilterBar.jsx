import React from 'react';
import { Search, RotateCcw, Calendar, ChevronDown } from 'lucide-react';

export default function BuilderEvidenceFilterBar({
  search,
  onSearchChange,
  builder,
  onBuilderChange,
  status,
  onStatusChange,
  verificationId,
  onVerificationIdChange,
  verificationIdsList = [],
  dateRange,
  onDateRangeChange,
  onClearFilters,
}) {
  const isFiltered =
    Boolean(search) ||
    builder !== 'ALL' ||
    status !== 'ALL' ||
    verificationId !== 'ALL' ||
    dateRange !== 'all';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-end gap-2.5">
        {/* Search Input */}
        <div className="flex flex-col flex-1 min-w-[160px] sm:min-w-[180px]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">
            Search
          </span>
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search builder runs..."
              aria-label="Search builder runs"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal h-[34px]"
            />
          </div>
        </div>

        {/* Builder Dropdown */}
        <div className="flex flex-col w-[110px] sm:w-[120px] shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1 truncate">
            Builder
          </span>
          <div className="relative">
            <select
              value={builder}
              onChange={(e) => onBuilderChange(e.target.value)}
              aria-label="Filter by builder"
              className="w-full appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer h-[34px] truncate"
            >
              <option value="ALL">All builders</option>
              <option value="Builder A">Builder A</option>
              <option value="Builder B">Builder B</option>
              <option value="Builder C">Builder C</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col w-[105px] sm:w-[115px] shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1 truncate">
            Status
          </span>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
              className="w-full appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer h-[34px] truncate"
            >
              <option value="ALL">All status</option>
              <option value="Success">Success</option>
              <option value="Unavailable">Unavailable</option>
              <option value="Divergent">Divergent</option>
              <option value="Failed">Failed</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Verification Run Dropdown */}
        <div className="flex flex-col w-[110px] sm:w-[120px] shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1 truncate">
            Verification Run
          </span>
          <div className="relative">
            <select
              value={verificationId}
              onChange={(e) => onVerificationIdChange(e.target.value)}
              aria-label="Filter by verification run"
              className="w-full appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer h-[34px] truncate"
            >
              <option value="ALL">All runs</option>
              {verificationIdsList.map((id) => (
                <option key={id} value={id}>
                  {id.length > 10 ? `${id.substring(0, 8)}...` : id}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Date Range Dropdown */}
        <div className="flex flex-col w-[105px] sm:w-[115px] shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1 truncate">
            Date Range
          </span>
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </div>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              aria-label="Filter by date range"
              className="w-full appearance-none pl-7 pr-6 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer h-[34px] truncate"
            >
              <option value="all">All time</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
              <option value="30d">Last 30d</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!isFiltered}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all h-[34px] ${
              isFiltered
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shadow-2xs'
                : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
            }`}
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="whitespace-nowrap">Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

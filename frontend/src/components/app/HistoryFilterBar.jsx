import React from 'react';
import {
  Search,
  RotateCcw,
  Calendar,
  Filter,
} from 'lucide-react';

export default function HistoryFilterBar({
  search = '',
  onSearchChange,
  verdict = 'ALL',
  onVerdictChange,
  verificationMode = 'ALL',
  onModeChange,
  repository = 'ALL',
  onRepositoryChange,
  repositoriesList = [],
  dateRange = 'all',
  onDateRangeChange,
  onClearFilters,
}) {
  const isFiltered =
    Boolean(search) ||
    verdict !== 'ALL' ||
    verificationMode !== 'ALL' ||
    repository !== 'ALL' ||
    dateRange !== 'all';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input (5 cols on lg) */}
        <div className="lg:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search verification runs..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            aria-label="Search verification runs"
          />
        </div>

        {/* Repository Filter (3 cols on lg) */}
        <div className="lg:col-span-3">
          <label htmlFor="repo-filter" className="sr-only">
            Repository
          </label>
          <select
            id="repo-filter"
            value={repository}
            onChange={(e) => onRepositoryChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer truncate"
          >
            <option value="ALL">All repositories</option>
            {repositoriesList.map((r) => (
              <option key={r} value={r}>
                {r.replace('https://github.com/', '').replace('.git', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Verdict Filter (2 cols on lg) */}
        <div className="lg:col-span-2">
          <label htmlFor="verdict-filter" className="sr-only">
            Verdict
          </label>
          <select
            id="verdict-filter"
            value={verdict}
            onChange={(e) => onVerdictChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All verdicts</option>
            <option value="ACCEPT">ACCEPT</option>
            <option value="ACCEPT_WITH_WARNING">ACCEPT WITH WARNING</option>
            <option value="REJECT">REJECT</option>
          </select>
        </div>

        {/* Date Range Filter (2 cols on lg) */}
        <div className="lg:col-span-2">
          <label htmlFor="date-range-filter" className="sr-only">
            Date Range
          </label>
          <div className="relative">
            <select
              id="date-range-filter"
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer truncate"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 days</option>
              <option value="month">Past 30 days</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Clear Filters Button (1 col on lg) */}
        <div className="lg:col-span-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!isFiltered}
            className={`w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isFiltered
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs cursor-pointer'
                : 'bg-transparent text-slate-300 border-transparent cursor-not-allowed opacity-50'
            }`}
            title="Reset all search and filter fields"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden lg:inline">Clear</span>
            <span className="lg:hidden">Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

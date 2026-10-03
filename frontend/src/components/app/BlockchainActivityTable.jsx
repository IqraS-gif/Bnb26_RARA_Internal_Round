import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  Box,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function BlockchainActivityTable({
  events = [],
  total = 0,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  loading = false,
  error = null,
  eventType = 'ALL',
  onEventTypeChange,
  dateRange = 'all',
  onDateRangeChange,
  onPageChange,
  onSelectEvent,
  onRetry,
}) {
  const [copiedTxId, setCopiedTxId] = useState(null);

  const handleCopyTx = async (e, txHash, id) => {
    e.stopPropagation();
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTxId(id);
      setTimeout(() => setCopiedTxId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const getEventIcon = (name) => {
    switch (name) {
      case 'AttestationSubmitted':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'ReleaseRegistered':
        return <Tag className="w-4 h-4 text-emerald-600" />;
      case 'BuilderRegistered':
        return <Box className="w-4 h-4 text-indigo-600" />;
      case 'EquivocationDetected':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'AttestationSuperseded':
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      default:
        return <Link2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const renderStatus = (status) => {
    const st = (status || '').toUpperCase();
    if (st === 'SUCCESS' || st === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Success
        </span>
      );
    }
    if (st === 'CONFLICT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Conflict
        </span>
      );
    }
    if (st === 'SUPERSEDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Superseded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {status}
      </span>
    );
  };

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600 stroke-[2.2]" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              On-Chain Verification Activity
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Recent blockchain transactions and events recorded by Quorum.
          </p>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Event Filter */}
          <div className="relative">
            <select
              value={eventType}
              onChange={(e) => onEventTypeChange && onEventTypeChange(e.target.value)}
              aria-label="Filter events by type"
              className="appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Events</option>
              <option value="AttestationSubmitted">AttestationSubmitted</option>
              <option value="ReleaseRegistered">ReleaseRegistered</option>
              <option value="BuilderRegistered">BuilderRegistered</option>
              <option value="EquivocationDetected">EquivocationDetected</option>
              <option value="AttestationSuperseded">AttestationSuperseded</option>
              <option value="BuilderDeactivated">BuilderDeactivated</option>
              <option value="BuilderReactivated">BuilderReactivated</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </div>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
              aria-label="Filter events by date range"
              className="appearance-none pl-7 pr-7 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-8 text-center bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Failed to load blockchain activity</h3>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading State Skeleton */}
      {loading && events.length === 0 && !error && (
        <div className="divide-y divide-slate-100 animate-pulse p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="py-2 flex items-center justify-between gap-4">
              <div className="h-4 bg-slate-100 rounded w-1/12" />
              <div className="h-4 bg-slate-100 rounded w-3/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
              <div className="h-4 bg-slate-100 rounded w-1/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && !error && (
        <div className="p-12 text-center text-slate-400">
          <Link2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <h3 className="text-sm font-bold text-slate-700">No On-Chain Activity Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Smart contract events will appear as release verifications are performed.
          </p>
        </div>
      )}

      {/* Events Table */}
      {!error && events.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="On-Chain Activity Table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th scope="col" className="py-2.5 px-3 pl-4 w-10">#</th>
                <th scope="col" className="py-2.5 px-3">Event</th>
                <th scope="col" className="py-2.5 px-3">Registry</th>
                <th scope="col" className="py-2.5 px-3">Block</th>
                <th scope="col" className="py-2.5 px-3">Transaction Hash</th>
                <th scope="col" className="py-2.5 px-3">Timestamp</th>
                <th scope="col" className="py-2.5 px-3 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {events.map((event, index) => {
                const rowNum = (page - 1) * pageSize + index + 1;
                const shortTx =
                  event.transaction_hash.length > 14
                    ? `${event.transaction_hash.substring(0, 10)}...`
                    : event.transaction_hash;

                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelectEvent && onSelectEvent(event)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* # */}
                    <td className="py-3 px-3 pl-4 text-slate-400 font-mono text-[11px]">
                      {rowNum}
                    </td>

                    {/* Event Name & Sub-label */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                          {getEventIcon(event.event_name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition-colors">
                            {event.event_name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                            {event.summary_label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Registry */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {event.registry_name}
                      </span>
                    </td>

                    {/* Block */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-slate-600 text-[11px]">
                      #{event.block_number}
                    </td>

                    {/* Transaction Hash */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-blue-600 font-medium text-[11px]">
                          {shortTx}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyTx(e, event.transaction_hash, event.id)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Copy transaction hash"
                          aria-label="Copy transaction hash"
                        >
                          {copiedTxId === event.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                      {event.formatted_timestamp}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 pr-4 text-right whitespace-nowrap">
                      {renderStatus(event.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!error && total > 0 && (
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 select-none">
          <div>
            Showing <strong className="text-slate-900">{startIdx}–{endIdx}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> events
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className={`p-1.5 rounded-lg border transition-all ${
                  page <= 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-50 bg-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-2xs cursor-pointer'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === page;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
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

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-1.5 rounded-lg border transition-all ${
                  page >= totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-50 bg-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-2xs cursor-pointer'
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

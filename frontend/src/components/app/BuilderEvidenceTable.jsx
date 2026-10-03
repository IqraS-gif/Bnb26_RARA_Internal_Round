import React, { useState } from 'react';
import {
  Copy,
  Check,
  ArrowRight,
  GitBranch,
  Play,
  RotateCcw,
  AlertCircle,
  Clock,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function BuilderEvidenceTable({
  items = [],
  loading,
  error,
  selectedId,
  onSelectEvidence,
  onNavigate,
  onRetry,
  pageOffset = 0,
}) {
  const [copiedHashId, setCopiedHashId] = useState(null);

  const handleCopyHash = async (e, hash, id) => {
    e.stopPropagation();
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHashId(id);
      setTimeout(() => setCopiedHashId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Render Status Badge
  const renderStatus = (status) => {
    const st = (status || '').toUpperCase();
    if (st === 'SUCCESS' || st === 'VALID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Success
        </span>
      );
    }
    if (st === 'DIVERGENT' || st === 'CONFLICTING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Divergent
        </span>
      );
    }
    if (st === 'UNAVAILABLE' || st === 'MISSING' || st === 'OFFLINE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Unavailable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Failed
      </span>
    );
  };

  // 1. Error State
  if (error) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Unable to load builder evidence</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // 2. Loading State Skeleton
  if (loading && items.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 animate-pulse">
          <div className="p-4 bg-slate-50/50 flex gap-4">
            <div className="h-4 bg-slate-200 rounded w-full" />
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-4 bg-slate-100 rounded w-1/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
              <div className="h-4 bg-slate-100 rounded w-2/12" />
              <div className="h-4 bg-slate-100 rounded w-1/12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (!loading && items.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 stroke-[1.8]" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Builder Evidence Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Builder evidence will appear here after a verification run completes.
        </p>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/verify')}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Verification &rarr;</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-label="Builder Evidence Table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
              <th scope="col" className="py-2.5 px-2.5 pl-3.5 w-8">#</th>
              <th scope="col" className="py-2.5 px-2.5">Builder</th>
              <th scope="col" className="py-2.5 px-2.5">Verification ID</th>
              <th scope="col" className="py-2.5 px-2.5">Repository</th>
              <th scope="col" className="py-2.5 px-2.5">Release Tag</th>
              <th scope="col" className="py-2.5 px-2.5">Status</th>
              <th scope="col" className="py-2.5 px-2.5">Artifact Hash</th>
              <th scope="col" className="py-2.5 px-2.5">Build Time</th>
              <th scope="col" className="py-2.5 px-2.5">Date &amp; Time</th>
              <th scope="col" className="py-2.5 px-2.5 pr-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.map((item, index) => {
              const isSelected = selectedId === item.id;
              const hasHash = Boolean(item.artifact_hash);

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectEvidence && onSelectEvidence(item)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/60 font-medium'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* # */}
                  <td className="py-3 px-2.5 pl-3.5 text-slate-400 font-mono text-[11px]">
                    {pageOffset + index + 1}
                  </td>

                  {/* Builder */}
                  <td className="py-3 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                    {item.builder_name}
                  </td>

                  {/* Verification ID */}
                  <td className="py-3 px-2.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) {
                          onNavigate(`/verify/${item.verification_id}`);
                        }
                      }}
                      className="font-mono text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium transition-colors"
                      title={item.verification_id}
                    >
                      {item.verification_id.length > 8
                        ? `${item.verification_id.substring(0, 8)}...`
                        : item.verification_id}
                    </button>
                  </td>

                  {/* Repository */}
                  <td className="py-3 px-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate max-w-[120px]" title={item.repository}>
                        {item.repository}
                      </span>
                    </div>
                  </td>

                  {/* Release Tag */}
                  <td className="py-3 px-2.5 whitespace-nowrap">
                    <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {item.release_tag}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-2.5 whitespace-nowrap">
                    {renderStatus(item.status)}
                  </td>

                  {/* Artifact Hash */}
                  <td className="py-3 px-2.5 whitespace-nowrap">
                    {hasHash ? (
                      <div className="flex items-center gap-1">
                        <span
                          className="font-mono text-[11px] text-slate-700"
                          title={item.artifact_hash}
                        >
                          {item.artifact_hash.substring(0, 10)}...
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyHash(e, item.artifact_hash, item.id)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Copy full artifact hash"
                          aria-label="Copy artifact hash"
                        >
                          {copiedHashId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </td>

                  {/* Build Time */}
                  <td className="py-3 px-2.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                    {item.build_duration_seconds != null
                      ? `${Number(item.build_duration_seconds).toFixed(1)}s`
                      : '—'}
                  </td>

                  {/* Date & Time */}
                  <td className="py-3 px-2.5 whitespace-nowrap text-slate-500 text-[11px]">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-2.5 pr-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvidence && onSelectEvidence(item);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-blue-50"
                      aria-label={`View evidence for ${item.builder_name}`}
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

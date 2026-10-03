import React, { useState } from 'react';
import { FileText, Copy, Check } from 'lucide-react';

export default function ReleaseContextSideCard({ context, loading }) {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (text, fieldName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  const repository = context?.repository || '—';
  const releaseTag = context?.release_tag || '—';
  const sourceCommit = context?.source_commit || '—';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Release Context
        </h2>
      </div>

      {/* Details List */}
      {loading ? (
        <div className="space-y-3 pt-4 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>
      ) : (
        <div className="space-y-3 pt-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Repository</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
              {repository}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Release Tag</span>
            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
              {releaseTag}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium shrink-0">Source Commit</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[120px]">
                {sourceCommit !== '—'
                  ? `${sourceCommit.substring(0, 16)}...`
                  : '—'}
              </span>
              {sourceCommit !== '—' && (
                <button
                  type="button"
                  onClick={() => handleCopy(sourceCommit, 'commit')}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Copy full source commit"
                  aria-label="Copy source commit"
                >
                  {copiedField === 'commit' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

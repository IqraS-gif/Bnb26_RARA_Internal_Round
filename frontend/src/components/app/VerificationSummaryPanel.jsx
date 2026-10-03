import React, { useState } from 'react';
import { FileText, Copy, Check } from 'lucide-react';

export default function VerificationSummaryPanel({
  verificationId = 'ver-01HF7..X9K2',
  repository = 'junegunn/fzf',
  releaseTag = 'v0.74.4',
  sourceCommit = 'a140afeb4d733cad3c96a56bf6db7e26853b6757',
  status = 'ACCEPT',
  completedAt = null,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (key, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const cleanRepo = repository.replace('https://github.com/', '').replace('.git', '');
  const truncatedId = verificationId.length > 14
    ? `${verificationId.slice(0, 10)}...${verificationId.slice(-4)}`
    : verificationId;
  const truncatedCommit = sourceCommit.length > 14
    ? `${sourceCommit.slice(0, 13)}...`
    : sourceCommit;

  // Format completedAt timestamp gracefully
  let formattedTime = 'Oct 3, 2026, 8:24 PM';
  if (completedAt) {
    try {
      const d = new Date(completedAt);
      if (!isNaN(d.getTime())) {
        formattedTime = d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {
      // Fallback
    }
  }

  const isAccept = status === 'ACCEPT';
  const isWarning = status === 'ACCEPT_WITH_WARNING';
  const isReject = status === 'REJECT';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-100">
        <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-900">Verification Summary</h3>
      </div>

      {/* Rows */}
      <div className="space-y-3 text-xs">
        
        {/* Verification ID */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Verification ID</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
            <span title={verificationId}>{truncatedId}</span>
            <button
              type="button"
              onClick={() => handleCopy('id', verificationId)}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy verification ID"
              aria-label="Copy verification ID"
            >
              {copiedKey === 'id' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Repository */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Repository</span>
          <span className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[150px]">
            {cleanRepo}
          </span>
        </div>

        {/* Release Tag */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Release Tag</span>
          <span className="font-semibold text-slate-800 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {releaseTag}
          </span>
        </div>

        {/* Source Commit */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Source Commit</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
            <span title={sourceCommit}>{truncatedCommit}</span>
            <button
              type="button"
              onClick={() => handleCopy('commit', sourceCommit)}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy source commit SHA"
              aria-label="Copy source commit SHA"
            >
              {copiedKey === 'commit' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Status</span>
          {isAccept ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ACCEPT
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              WARNING
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              REJECT
            </span>
          )}
        </div>

        {/* Completed At */}
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-medium">Completed At</span>
          <span className="font-semibold text-slate-700 text-[11px]">
            {formattedTime}
          </span>
        </div>

      </div>

    </div>
  );
}

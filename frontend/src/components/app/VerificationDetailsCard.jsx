import React, { useState } from 'react';
import { FileText, Copy, Check } from 'lucide-react';

export default function VerificationDetailsCard({
  repository = 'junegunn/fzf',
  releaseTag = 'v0.74.4',
  sourceCommit = 'a140afeb4d733cad3c96a56bf6db7e26853b6757',
  verificationId = null,
  isRunning = false,
}) {
  const [copiedCommit, setCopiedCommit] = useState(false);

  const handleCopy = (text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedCommit(true);
      setTimeout(() => setCopiedCommit(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isRealCommit =
    sourceCommit &&
    sourceCommit !== 'Not resolved' &&
    sourceCommit !== '—' &&
    sourceCommit.length >= 7;

  const displayCommit = isRealCommit
    ? `${sourceCommit.slice(0, 13)}...`
    : sourceCommit || 'Not resolved';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-100">
        <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-900">Verification Details</h3>
      </div>

      <div className="space-y-3 text-xs">
        {/* Repository */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Repository</span>
          <span className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[200px]" title={repository}>
            {repository || '—'}
          </span>
        </div>

        {/* Release Tag */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Release Tag</span>
          <span className="font-semibold text-slate-800 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {releaseTag || '—'}
          </span>
        </div>

        {/* Source Commit */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">Source Commit</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {isRealCommit ? (
              <>
                <span className="text-slate-800" title={sourceCommit}>
                  {displayCommit}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(sourceCommit)}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded"
                  title="Copy full commit SHA"
                  aria-label="Copy full commit SHA"
                >
                  {copiedCommit ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </>
            ) : (
              <span className="text-slate-400 italic">{displayCommit}</span>
            )}
          </div>
        </div>

        {/* Verification ID (when running or present) */}
        {(isRunning || verificationId) && (
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Verification ID</span>
            <span
              className={`font-mono text-[11px] ${
                isRunning && !verificationId
                  ? 'text-blue-600 font-medium italic animate-pulse'
                  : 'font-semibold text-slate-800'
              }`}
            >
              {verificationId ? `${verificationId.slice(0, 12)}...` : 'Generating...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

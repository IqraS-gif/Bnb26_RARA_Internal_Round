import React, { useState } from 'react';
import { ShieldCheck, Copy, Check } from 'lucide-react';

export default function ReleaseInfoSideCard({ release = {} }) {
  const [copiedCommit, setCopiedCommit] = useState(false);

  const repository = release.repository || 'https://github.com/junegunn/fzf.git';
  const repoName = repository.replace('https://github.com/', '').replace('.git', '');
  const releaseTag = release.tag || release.release_tag || 'v0.74.4';
  const sourceCommit = release.source_commit || '';

  const handleCopyCommit = () => {
    if (!sourceCommit) return;
    try {
      navigator.clipboard?.writeText(sourceCommit);
      setCopiedCommit(true);
      setTimeout(() => setCopiedCommit(false), 2000);
    } catch {
      // Fallback
    }
  };

  const truncatedCommit = sourceCommit.length > 18
    ? `${sourceCommit.slice(0, 14)}...`
    : sourceCommit || 'N/A';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Release Information</h3>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Repository */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Repository</span>
          <span className="font-semibold text-slate-900 font-mono text-[11px] truncate max-w-[170px]" title={repoName}>
            {repoName}
          </span>
        </div>

        {/* Release Tag */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Release Tag</span>
          <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
            {releaseTag}
          </span>
        </div>

        {/* Source Commit */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Source Commit</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
            <span title={sourceCommit}>{truncatedCommit}</span>
            {sourceCommit && (
              <button
                type="button"
                onClick={handleCopyCommit}
                className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                title="Copy full source commit"
              >
                {copiedCommit ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

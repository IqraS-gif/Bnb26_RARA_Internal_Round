import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Inbox,
  AlertCircle,
  Play,
} from 'lucide-react';

export default function HistoryTable({
  items = [],
  loading = false,
  error = null,
  onNavigate,
  onRetry,
}) {
  const [copiedCommit, setCopiedCommit] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(text);
      setCopiedCommit(id);
      setTimeout(() => setCopiedCommit(null), 2000);
    } catch {
      // Fallback
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '—';
    }
  };

  const formatDuration = (seconds) => {
    if (seconds == null) return '';
    const s = Math.round(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Error State
  if (error) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-2xs space-y-3">
        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Unable to load verification history
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-12 bg-slate-50 border border-slate-100 rounded-xl animate-pulse flex items-center justify-between px-4"
            >
              <div className="h-4 w-32 bg-slate-200/70 rounded" />
              <div className="h-4 w-20 bg-slate-200/70 rounded" />
              <div className="h-4 w-24 bg-slate-200/70 rounded" />
              <div className="h-4 w-16 bg-slate-200/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-14 text-center shadow-2xs space-y-3.5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-2xs">
          <Inbox className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            No verification history yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Completed release verification runs will appear here automatically.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/verify')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Run Your First Verification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th scope="col" className="py-3 px-4 w-12 text-center">#</th>
              <th scope="col" className="py-3 px-4">Repository</th>
              <th scope="col" className="py-3 px-4">Release Tag</th>
              <th scope="col" className="py-3 px-4">Source Commit</th>
              <th scope="col" className="py-3 px-4">Verification Mode</th>
              <th scope="col" className="py-3 px-4">Verdict</th>
              <th scope="col" className="py-3 px-4 text-center">Builders</th>
              <th scope="col" className="py-3 px-4">Date & Time</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {items.map((item, idx) => {
              const isAccept = item.verdict === 'ACCEPT';
              const isWarning = item.verdict === 'ACCEPT_WITH_WARNING';
              const isReject = item.verdict === 'REJECT';

              const repoName = (item.repository || 'junegunn/fzf')
                .replace('https://github.com/', '')
                .replace('.git', '');
              const repoUrl = item.repository?.startsWith('http')
                ? item.repository
                : `https://github.com/${repoName}`;

              const commitShort = item.source_commit
                ? `${item.source_commit.slice(0, 12)}...`
                : '—';

              const durationStr = formatDuration(item.duration_seconds);

              return (
                <tr
                  key={item.verification_id || idx}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* # */}
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Repository */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-slate-700 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors truncate max-w-[150px]"
                        title={repoName}
                      >
                        {repoName}
                      </a>
                    </div>
                  </td>

                  {/* Release Tag */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-slate-900 text-[11px] bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/70">
                      {item.release_tag}
                    </span>
                  </td>

                  {/* Source Commit */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span title={item.source_commit}>{commitShort}</span>
                      {item.source_commit && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item.source_commit, item.verification_id)}
                          className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Copy commit SHA"
                        >
                          {copiedCommit === item.verification_id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Verification Mode */}
                  <td className="py-3.5 px-4 text-slate-800 text-[11px] font-medium">
                    {item.verification_mode || 'Normal Verification'}
                  </td>

                  {/* Verdict */}
                  <td className="py-3.5 px-4">
                    {isAccept ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ACCEPT
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        ACCEPT WITH WARNING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        REJECT
                      </span>
                    )}
                  </td>

                  {/* Builders */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {item.builders_matching ?? 3} / 3
                  </td>

                  {/* Date & Time */}
                  <td className="py-3.5 px-4 text-[11px]">
                    <span className="text-slate-900 font-semibold block leading-tight">
                      {formatDate(item.completed_at || item.created_at)}
                    </span>
                    {durationStr && (
                      <span className="text-slate-400 font-mono text-[10px] block mt-0.5">
                        {durationStr}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate(`/verify/${item.verification_id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50/70"
                    >
                      <span>View Result</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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

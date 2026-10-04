import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Binary,
  FileCheck,
  ExternalLink,
} from 'lucide-react';

export default function ArtifactComparisonTab({
  builders = [],
  expectedHash = '',
  summary = {},
  status = 'ACCEPT',
  evidence = {},
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const isReject = status === 'REJECT';
  const isConflict = summary.conflicting_builder_count > 0 || builders.some((b) => b.status === 'CONFLICTING');
  const officialArtifact = evidence?.official_artifact;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Binary className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Artifact Hash Agreement & Comparison
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Host-calculated SHA-256 binary digests evaluated across independent build environments.
            </p>
          </div>
        </div>

        {isConflict ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Hash Conflict Detected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Full Hash Agreement
          </span>
        )}
      </div>

      {/* Hash Breakdown Table */}
      <div className="space-y-3">
        {builders.map((b, idx) => {
          const isConflicting = b.status === 'CONFLICTING' || b.matches_quorum_hash === false;
          const isMissing = b.status === 'MISSING' || !b.artifact_hash;
          const bName = b.builder_name || `Builder ${String.fromCharCode(65 + idx)}`;
          const bHash = b.artifact_hash || 'No artifact generated (offline)';

          return (
            <div
              key={b.builder_address || idx}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isConflicting
                  ? 'bg-rose-50/50 border-rose-200'
                  : isMissing
                  ? 'bg-slate-50/50 border-slate-200'
                  : 'bg-emerald-50/30 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isConflicting
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : isMissing
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{bName}</h4>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">
                    {b.builder_address ? `${b.builder_address.slice(0, 10)}...${b.builder_address.slice(-6)}` : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs bg-white border border-slate-200/90 rounded-lg px-3 py-1.5 overflow-hidden">
                <span
                  className={`truncate max-w-[260px] sm:max-w-[340px] font-semibold ${
                    isConflicting
                      ? 'text-rose-700'
                      : isMissing
                      ? 'text-slate-400 font-normal italic'
                      : 'text-slate-900'
                  }`}
                  title={bHash}
                >
                  {bHash}
                </span>
                {b.artifact_hash && (
                  <button
                    type="button"
                    onClick={() => handleCopy(bHash, `ac-${idx}`)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy full SHA-256"
                  >
                    {copiedKey === `ac-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Artifact Integrity Comparison Panel */}
      {officialArtifact && (
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Official Release Artifact Verification
              </h4>
            </div>

            {officialArtifact.matches_builder_quorum ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Match: YES (Integrity Verified)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Match: NO (Hash Mismatch)
              </span>
            )}
          </div>

          {/* Official URL */}
          <div className="text-xs space-y-1">
            <span className="text-slate-500 font-medium">Artifact Source URL:</span>
            <div className="flex items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-lg px-3 py-2">
              <a
                href={officialArtifact.official_artifact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-blue-600 hover:text-blue-800 truncate"
              >
                {officialArtifact.official_artifact_url}
              </a>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Hashes Comparison Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Official Download Hash</span>
              <span className="font-mono text-[11px] text-slate-900 font-bold break-all">
                {officialArtifact.official_artifact_hash || 'Download failed'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Builder Quorum Agreed Hash</span>
              <span className="font-mono text-[11px] text-emerald-700 font-bold break-all">
                {officialArtifact.builder_quorum_hash || summary.agreed_artifact_hash || 'No Quorum'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expected vs Quorum Match Comparison (if given) */}
      {expectedHash && !officialArtifact && (
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Expected Release Hash (Upstream):</span>
            <span className="font-mono text-slate-900 font-bold truncate max-w-[280px]">
              {expectedHash}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Agreed Quorum Hash:</span>
            <span className="font-mono text-emerald-700 font-bold truncate max-w-[280px]">
              {summary.agreed_artifact_hash || 'No Quorum'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

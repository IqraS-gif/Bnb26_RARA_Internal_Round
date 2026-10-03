import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertTriangle, Copy, Check, Info } from 'lucide-react';

export default function ArtifactHashComparison({
  builders = [],
  expectedHash = 'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3',
  artifactSize = '4,690,072 bytes',
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

  // Group builders dynamically by artifact hash
  const hashGroups = {};
  builders.forEach((b) => {
    const hash = b.artifact_hash;
    if (hash) {
      if (!hashGroups[hash]) {
        hashGroups[hash] = [];
      }
      hashGroups[hash].push(b.builder_name || b.builder_address || 'Builder');
    }
  });

  const uniqueHashes = Object.keys(hashGroups);

  // Identify matching group vs conflicting group(s)
  let matchingHash = expectedHash;
  if (!hashGroups[matchingHash] && uniqueHashes.length > 0) {
    // Pick the group with the largest number of builders
    matchingHash = uniqueHashes.reduce((a, b) =>
      hashGroups[a].length >= hashGroups[b].length ? a : b
    );
  }

  const matchingBuilders = hashGroups[matchingHash] || ['Builder A', 'Builder B'];
  const conflictingHashes = uniqueHashes.filter((h) => h !== matchingHash);
  const conflictingHash =
    conflictingHashes[0] ||
    '3010ad9c3c9dd74a459df2d00481949b26bad298bd8d8cbd2a0ef26aa5767801';
  const conflictingBuilders =
    conflictingHashes.length > 0
      ? hashGroups[conflictingHash]
      : ['Builder C'];

  const matchingBuildersLabel = matchingBuilders.join(', ');
  const conflictingBuildersLabel = conflictingBuilders.join(', ');

  const subtitle = `${matchingBuildersLabel} produced the same artifact. ${conflictingBuildersLabel} produced a different artifact.`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 animate-fade-in">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Scale className="w-4.5 h-4.5 stroke-[2]" aria-hidden="true" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Artifact Hash Comparison
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Two Column Hash Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        
        {/* Left Card: Matching Artifact Group */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <h4 className="text-xs font-bold text-emerald-950">
                Matching Artifact ({matchingBuildersLabel})
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-emerald-800/80 font-medium block text-[11px] mb-0.5">
                  SHA-256
                </span>
                <div className="flex items-start justify-between gap-1 font-mono text-[11px] text-emerald-950 bg-white/90 border border-emerald-200/70 rounded-lg p-2 break-all">
                  <span>{matchingHash}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('matchHash', matchingHash)}
                    className="p-1 text-emerald-600 hover:text-emerald-800 transition-colors shrink-0"
                    title="Copy matching SHA-256"
                    aria-label="Copy matching SHA-256"
                  >
                    {copiedKey === 'matchHash' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/50">
                <span className="text-emerald-800/80 font-medium">Size</span>
                <span className="font-mono font-semibold text-emerald-950">
                  {artifactSize}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-800/80 font-medium">Produced by</span>
                <span className="font-semibold text-emerald-950">
                  {matchingBuildersLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Conflicting Artifact Group */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-rose-200/60">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <h4 className="text-xs font-bold text-rose-950">
                Conflicting Artifact ({conflictingBuildersLabel})
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-rose-800/80 font-medium block text-[11px] mb-0.5">
                  SHA-256
                </span>
                <div className="flex items-start justify-between gap-1 font-mono text-[11px] text-rose-950 bg-white/90 border border-rose-200/70 rounded-lg p-2 break-all">
                  <span>{conflictingHash}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('conflictHash', conflictingHash)}
                    className="p-1 text-rose-600 hover:text-rose-800 transition-colors shrink-0"
                    title="Copy conflicting SHA-256"
                    aria-label="Copy conflicting SHA-256"
                  >
                    {copiedKey === 'conflictHash' ? (
                      <Check className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-rose-200/50">
                <span className="text-rose-800/80 font-medium">Size</span>
                <span className="font-mono font-semibold text-rose-950">
                  {artifactSize}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-rose-800/80 font-medium">Produced by</span>
                <span className="font-semibold text-rose-950">
                  {conflictingBuildersLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Subtle Information Note */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Artifact divergence does not by itself prove malicious intent. Quorum identifies disagreement between trusted builder evidence and prevents the conflicting artifact from satisfying the quorum policy.
        </p>
      </div>

    </div>
  );
}

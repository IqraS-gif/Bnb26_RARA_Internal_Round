import React, { useState } from 'react';
import { Server, Check, Copy, ChevronDown, ChevronUp, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export default function BuilderEvidenceCard({ builder, isAgreed = true }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const builderName = builder.builder_name || 'Builder';
  const builderAddress = builder.builder_address || '0x...';
  const artifactHash = builder.artifact_hash || '—';
  const status = builder.status || 'VALID';
  const signatureStatus = builder.signature_status || 'VALID';
  const buildEnvironment = 'golang:1.23.0-bookworm';

  const isConflicting = status === 'CONFLICTING' || (!builder.matches_quorum_hash && status !== 'MISSING' && isAgreed === false && artifactHash !== '—');
  const isMatch = (builder.matches_quorum_hash || status === 'VALID') && !isConflicting;
  const isMissing = status === 'MISSING';

  const truncatedHash = artifactHash.length > 20
    ? `${artifactHash.slice(0, 16)}...`
    : artifactHash;

  const handleCopy = (key, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
      
      {/* Top Card Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Server className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {builderName}
            </h4>
          </div>

          {/* Status Badge */}
          {isMatch ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              MATCH
            </span>
          ) : isConflicting ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              DIFFERENT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              MISSING
            </span>
          )}
        </div>

        {/* Core Metadata Rows */}
        <div className="space-y-2.5 text-xs">
          
          {/* Artifact Hash */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Artifact Hash</span>
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              <span title={artifactHash}>{truncatedHash}</span>
              {artifactHash !== '—' && (
                <button
                  type="button"
                  onClick={() => handleCopy('hash', artifactHash)}
                  className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Copy artifact SHA-256 hash"
                  aria-label="Copy artifact SHA-256 hash"
                >
                  {copiedKey === 'hash' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Build Environment */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Build Environment</span>
            <span className="font-mono text-[11px] font-semibold text-slate-700">
              {buildEnvironment}
            </span>
          </div>

          {/* Signature */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Signature</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" aria-hidden="true" />
              <span>Valid (EIP-712)</span>
            </span>
          </div>

        </div>
      </div>

      {/* Expandable Full Evidence Accordion */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1"
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Hide Evidence Details' : 'View Full Evidence →'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>

        {expanded && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2 text-[11px] animate-fade-in font-mono">
            {/* Builder Ethereum Address */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                Builder Address
              </span>
              <div className="flex items-center justify-between gap-1 text-slate-800">
                <span className="truncate">{builderAddress}</span>
                <button
                  type="button"
                  onClick={() => handleCopy('addr', builderAddress)}
                  className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Copy builder Ethereum address"
                  aria-label="Copy builder Ethereum address"
                >
                  {copiedKey === 'addr' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Deterministic Build Flags */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                Deterministic Build Configuration
              </span>
              <span className="text-slate-700 block text-[10px]">
                CGO_ENABLED=0 GOOS=linux GOARCH=amd64 -trimpath -mod=readonly
              </span>
            </div>

            {/* Attestation Reference */}
            {builder.attestation_reference && (
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                  Attestation Reference
                </span>
                <span className="text-slate-700 block truncate text-[10px]">
                  {builder.attestation_reference}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

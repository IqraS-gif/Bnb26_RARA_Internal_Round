import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  FileCheck,
} from 'lucide-react';

export default function AttestationEvidenceTab({
  builders = [],
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <FileCheck className="w-4 h-4 stroke-[2]" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            EIP-712 Typed Structured Attestations
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed attestations verified using secp256k1 ecrecover.
          </p>
        </div>
      </div>

      {/* Builder Attestation Cards */}
      <div className="space-y-4">
        {builders.map((b, idx) => {
          const isMissing = b.status === 'MISSING' || b.signature_status === 'MISSING';
          const isValid = b.signature_status === 'VALID' || (!isMissing && b.status === 'VALID');
          const isInvalid = b.signature_status === 'INVALID';
          const bName = b.builder_name || `Builder ${String.fromCharCode(65 + idx)}`;
          const bAddr = b.builder_address || '0x...';

          return (
            <div
              key={bAddr || idx}
              className={`p-4 rounded-xl border transition-all ${
                isValid
                  ? 'bg-slate-50/60 border-slate-200/90'
                  : isInvalid
                  ? 'bg-rose-50/60 border-rose-200'
                  : 'bg-slate-50/30 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 shadow-2xs">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{bName}</h4>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                      <span>{bAddr}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bAddr, `att-addr-${idx}`)}
                        className="p-0.5 text-slate-400 hover:text-blue-600"
                        title="Copy builder address"
                      >
                        {copiedKey === `att-addr-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Signature status badge */}
                {isValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Valid EIP-712 Signature
                  </span>
                ) : isInvalid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Invalid Signature
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    No Attestation (Offline)
                  </span>
                )}
              </div>

              {/* Attestation details */}
              {!isMissing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-sans">Attested Artifact SHA-256</span>
                    <span className="text-slate-900 font-semibold truncate block" title={b.artifact_hash}>
                      {b.artifact_hash || '—'}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-sans">Domain Separator</span>
                    <span className="text-slate-800 font-semibold block truncate">
                      Quorum v1 (Chain ID: {evidence.chain_id || 31337})
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Builder did not participate in this verification run; no attestation payload generated.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

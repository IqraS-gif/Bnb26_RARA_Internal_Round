import React from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

export default function DocsQuorumPolicySection() {
  return (
    <section id="quorum-policy" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              How the 2-of-3 Policy Works
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Deterministic threshold consensus and outcome determination
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          The Quorum consumer engine relies on a local trust policy. In the current configuration, the verifier trusts <strong className="text-slate-900 font-semibold">3 independent builders</strong> (Builder A, Builder B, and Builder C) and requires at least <strong className="text-slate-900 font-semibold">2 matching valid attestations (2-of-3 threshold)</strong> before a software release is accepted.
        </p>

        {/* 3 Outcome Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* ACCEPT */}
          <div className="p-5 rounded-xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  ACCEPT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1.5">
                Full Quorum Agreement
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Required quorum (≥ 2) is met.</li>
                <li>All available builders agree on identical SHA-256 artifact hash.</li>
                <li>No conflicting builder evidence detected.</li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60">
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                High Confidence
              </span>
            </div>
          </div>

          {/* ACCEPT WITH WARNING */}
          <div className="p-5 rounded-xl bg-amber-50/40 border border-amber-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  ACCEPT WITH WARNING
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1.5">
                Partial Quorum (1 Offline)
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Required quorum (2 builders) is still satisfied.</li>
                <li>One trusted builder is offline or missing evidence.</li>
                <li>The 2 available builders agree completely.</li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60">
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                Quorum Met (Degraded Availability)
              </span>
            </div>
          </div>

          {/* REJECT */}
          <div className="p-5 rounded-xl bg-rose-50/40 border border-rose-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  REJECT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1.5">
                Conflict or Insufficient Quorum
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Conflicting artifact hash detected among builders, OR</li>
                <li>Fewer than 2 trusted builders provide valid attestations (insufficient quorum).</li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200/60">
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                Verification Failed
              </span>
            </div>
          </div>
        </div>

        {/* Critical Distinction Box: OFFLINE vs CONFLICT */}
        <div className="p-4 sm:p-5 rounded-xl bg-blue-50/60 border border-blue-200/80 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Critical Distinction: OFFLINE ≠ CONFLICT
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2.5">
                <div className="p-3 bg-white rounded-lg border border-blue-100 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">
                    Unavailable / Offline Builder
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Means evidence is <strong>missing</strong>. If the remaining builders satisfy the quorum threshold without disagreement, the release is accepted with a warning.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">
                    Conflicting / Divergent Builder
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Means the builder actively produced and submitted a <strong>different artifact hash</strong>. Any artifact divergence triggers an immediate <strong>REJECT</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realistic Technical Limitations Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-900 font-semibold">Important Scope & Security Boundary:</strong> Quorum proves that independent compilation environments reproduced the exact same byte-for-byte binary from a pinned Git commit. It does <em>not</em> claim that majority agreement automatically guarantees software is bug-free, nor does it prove that the source code itself is benign or free of vulnerabilities.
          </p>
        </div>
      </div>
    </section>
  );
}

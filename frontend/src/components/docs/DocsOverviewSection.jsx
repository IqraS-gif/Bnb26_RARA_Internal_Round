import React from 'react';
import {
  ShieldCheck,
  FileCode,
  Lock,
  Layers,
  CheckCircle2,
  ArrowDown,
  Server,
  Cpu,
} from 'lucide-react';

export default function DocsOverviewSection() {
  return (
    <section id="overview" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              What is Quorum?
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Multi-party deterministic build consensus & blockchain audit trail
            </p>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          <strong className="text-slate-900 font-semibold">Quorum</strong> is a transparent, verifiable software supply chain verification system. It guarantees that a released software artifact was built from an exact pinned source commit by having multiple independent trusted builders compile the source in isolated environments, sign their cryptographic attestations, record the evidence on an immutable blockchain ledger, and allow the consumer verifier to enforce an independent quorum policy.
        </p>

        {/* 3 Summary Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Independent Builds</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Reproducible compilation in isolated container environments across multiple trusted builder nodes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Cryptographic Attestations</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Builders sign structured build metadata and SHA-256 artifact hashes using EIP-712 typed signatures.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              All attestations, releases, and builder states are registered on Ethereum smart contracts.
            </p>
          </div>
        </div>

        {/* Core Verification Principle Diagram */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-5 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center justify-between">
            <span>High-Level Verification Pipeline</span>
            <span className="text-[11px] font-normal text-slate-500 lowercase">8 deterministic steps</span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Flow Visual */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-col gap-2">
                {/* Step 1 & 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Step 1</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">Source Release (Git Tag)</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Step 2</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">Exact Commit Resolution</p>
                  </div>
                </div>

                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Step 3: 3 Builders */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/80 text-center">
                    <p className="text-xs font-bold text-blue-900">Builder A</p>
                    <p className="text-[10px] text-blue-700">Docker Isolated</p>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/80 text-center">
                    <p className="text-xs font-bold text-blue-900">Builder B</p>
                    <p className="text-[10px] text-blue-700">Docker Isolated</p>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/80 text-center">
                    <p className="text-xs font-bold text-blue-900">Builder C</p>
                    <p className="text-[10px] text-blue-700">Docker Isolated</p>
                  </div>
                </div>

                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Step 4 & 5: Artifact Hash + EIP-712 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Step 4</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">SHA-256 Artifact Hashes</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Step 5</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">EIP-712 Signed Attestations</p>
                  </div>
                </div>

                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Step 6 & 7: Blockchain + Quorum Policy */}
                <div className="p-3 bg-slate-900 text-white rounded-lg border border-slate-800 text-center shadow-xs">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 6 & 7</span>
                    <span className="text-[10px] text-slate-400">Ethereum Registries + Local 2-of-3 Policy</span>
                  </div>
                  <p className="text-xs font-semibold mt-1">Consumer Verifier Engine</p>
                </div>

                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Step 8: Verdict */}
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Step 8: Final Decision</span>
                  <p className="text-xs font-bold text-emerald-900 mt-0.5">
                    ACCEPT &nbsp;|&nbsp; ACCEPT WITH WARNING &nbsp;|&nbsp; REJECT
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist Benefits */}
            <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                Core Guarantees
              </h4>
              <div className="space-y-2.5">
                {[
                  'Independent builds prevent single point of compromise',
                  'EIP-712 typed signatures tie artifacts to builder keys',
                  'On-chain smart contracts record immutable audit log',
                  'Consumer-side verifier holds authoritative trust policy',
                  'Detects silent builder divergence or tampering',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

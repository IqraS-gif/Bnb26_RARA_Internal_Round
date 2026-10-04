import React from 'react';
import {
  Cpu,
  Server,
  Shield,
  FileCheck,
  Blocks,
  FileCode2,
  Lock,
} from 'lucide-react';

export default function DocsArchitectureSection() {
  return (
    <section id="system-architecture" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              System Architecture
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Component topology and decoupled responsibilities
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Quorum decouples the build infrastructure, the blockchain audit layer, and the consumer verification engine. This architecture prevents any single compromised component from dictating the verification verdict.
        </p>

        {/* Visual Architecture Diagram Card */}
        <div className="p-6 rounded-xl bg-slate-50/70 border border-slate-200/80 mb-8 overflow-x-auto">
          <div className="min-w-[500px] flex flex-col items-center">
            {/* Top: Quorum System */}
            <div className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs tracking-wide">
              QUORUM VERIFICATION SYSTEM
            </div>

            {/* Down line */}
            <div className="w-px h-6 bg-slate-300 my-1" />

            {/* 3 Builders Row */}
            <div className="w-full max-w-md grid grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
                <span className="text-xs font-bold text-slate-800 block">Builder A</span>
                <span className="text-[10px] text-slate-500">Node #1</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
                <span className="text-xs font-bold text-slate-800 block">Builder B</span>
                <span className="text-[10px] text-slate-500">Node #2</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
                <span className="text-xs font-bold text-slate-800 block">Builder C</span>
                <span className="text-[10px] text-slate-500">Node #3</span>
              </div>
            </div>

            {/* Down line */}
            <div className="w-px h-6 bg-slate-300 my-1" />

            {/* Middle: Artifact Evidence */}
            <div className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-xs shadow-2xs">
              SHA-256 Hashes + EIP-712 Signed Attestations
            </div>

            {/* Down line */}
            <div className="w-px h-6 bg-slate-300 my-1" />

            {/* Consumer Verifier Core */}
            <div className="w-full max-w-md p-3.5 bg-slate-900 text-white rounded-xl text-center shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                Consumer Verifier Engine
              </span>
              <span className="text-[11px] text-slate-300">
                Independent client-side evaluation & consensus authority
              </span>
            </div>

            {/* Split branches */}
            <div className="w-full max-w-md grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  Trusted Builder Policy
                </span>
                <span className="text-[10px] text-slate-500 leading-snug block">
                  Local consumer-side JSON configuration (required quorum & trusted addresses)
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  Blockchain Evidence Layer
                </span>
                <span className="text-[10px] text-slate-500 leading-snug block">
                  Read-only Ethereum JSON-RPC (Anvil Localnet)
                </span>
              </div>
            </div>

            {/* Registry contracts bottom */}
            <div className="w-full max-w-md grid grid-cols-3 gap-2 mt-3">
              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                <span className="text-[11px] font-bold text-blue-900 block">BuilderRegistry</span>
                <span className="text-[9px] text-blue-700">Identities & Status</span>
              </div>
              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                <span className="text-[11px] font-bold text-blue-900 block">ReleaseRegistry</span>
                <span className="text-[9px] text-blue-700">Releases & Commits</span>
              </div>
              <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                <span className="text-[11px] font-bold text-blue-900 block">AttestationRegistry</span>
                <span className="text-[9px] text-blue-700">Signed Attestations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Component Descriptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">Builder Node</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fetches pinned source code, executes hermetic Docker container builds, hashes the generated binary with SHA-256, and cryptographically signs typed build metadata using secp256k1 keys.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Consumer Verifier</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The sole decision-making authority. Independently evaluates Git tags, recovers cryptographic signatures, compares artifact hashes, queries smart contracts, and enforces the trust policy.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Lock className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900">Trusted Builder Policy</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A consumer-controlled policy defining which builder Ethereum addresses are recognized as trusted and what quorum threshold (e.g. 2-of-3) is required to accept software.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Blocks className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900">Blockchain Evidence Layer</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides an immutable, tamper-evident public audit log of registered releases, builder identity lifecycle, and historical attestation submissions across three smart contracts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

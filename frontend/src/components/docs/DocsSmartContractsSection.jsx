import React from 'react';
import {
  FileCode2,
  Server,
  Tag,
  FileCheck2,
  History,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default function DocsSmartContractsSection({ onNavigate }) {
  return (
    <section id="smart-contracts" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Smart Contract Registries
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              On-chain decentralized identity, release pinning, and attestation ledger
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Quorum relies on three lightweight Solidity smart contracts deployed on the blockchain. These contracts provide authoritative public read access while ensuring historical evidence cannot be tampered with or overwritten.
        </p>

        {/* 3 Registry Cards */}
        <div className="space-y-3.5 mb-8">
          {/* BuilderRegistry */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    BuilderRegistry.sol
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    0x5FbDB2315678afecb367f032d93F642f64180aa3
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-center">
                Active Registry
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              <strong>Purpose:</strong> Maintains builder identities, human-readable labels (e.g. "Builder A"), target compilation architectures (e.g. <code>docker-linux-amd64</code>), and operational active/inactive status. Deactivated builders are automatically ignored during verification.
            </p>
          </div>

          {/* ReleaseRegistry */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    ReleaseRegistry.sol
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-center">
                Active Registry
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              <strong>Purpose:</strong> Records canonical software releases. Stores the repository URL, release tag name, and exact <code>sourceCommit</code> bytes32 hash. Prevents upstream repository maintainers or attackers from retroactively swapping out Git tags after a build is registered.
            </p>
          </div>

          {/* AttestationRegistry */}
          <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    AttestationRegistry.sol
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-center">
                Active Registry
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              <strong>Purpose:</strong> Stores signed builder attestations. Contains the builder address, release identifier, SHA-256 artifact hash, attestation hash, reference URI, and block timestamp.
            </p>
          </div>
        </div>

        {/* 2 Detailed Concept Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Historical Evidence Preservation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2 text-slate-900">
              <History className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold">Historical Evidence Preservation</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Smart contracts in Quorum never delete past attestations. If a builder submits an updated attestation for the same release, the contract marks the earlier record as <code>SUPERSEDED</code> while preserving the complete historical timeline for auditability.
            </p>
          </div>

          {/* EquivocationDetected Event */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2 text-slate-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold">Equivocation Detection</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If a builder submits conflicting artifact hashes for the same release commit, the smart contract emits an <code>EquivocationDetected</code> event. This flags the builder identity for investigation without jumping to assumptions.
            </p>
          </div>
        </div>

        {/* Link to Blockchain Evidence page */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Want to inspect live blockchain transactions and contract events?
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/blockchain')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Blockchain Evidence</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

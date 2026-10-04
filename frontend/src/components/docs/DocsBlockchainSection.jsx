import React from 'react';
import {
  Blocks,
  KeyRound,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Network,
} from 'lucide-react';

const ATTESTATION_FIELDS = [
  { field: 'releaseId', type: 'bytes32', desc: 'Cryptographic hash identifying the software release.' },
  { field: 'repository', type: 'string', desc: 'Canonical Git remote URL of the upstream repository.' },
  { field: 'releaseTag', type: 'string', desc: 'Upstream Git tag version identifier (e.g. v0.74.4).' },
  { field: 'sourceCommit', type: 'bytes32', desc: 'Exact pinned 40-character Git commit hash.' },
  { field: 'artifactHash', type: 'bytes32', desc: 'SHA-256 hash of the compiled binary artifact.' },
  { field: 'artifactReference', type: 'string', desc: 'Canonical release artifact asset name or URL.' },
  { field: 'builderAddress', type: 'address', desc: 'Ethereum address of the signing builder node.' },
  { field: 'buildImageDigest', type: 'string', desc: 'Docker image SHA-256 digest ensuring hermetic environment.' },
  { field: 'buildPlatform', type: 'string', desc: 'Target compilation OS and architecture (e.g. linux/amd64).' },
  { field: 'buildFlags', type: 'string', desc: 'Deterministic compilation environment flags used.' },
  { field: 'timestamp', type: 'uint256', desc: 'Unix timestamp when compilation completed.' },
];

export default function DocsBlockchainSection() {
  return (
    <section id="blockchain-attestations" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Blockchain & Attestations
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              EIP-712 typed structured data signing and on-chain verification evidence
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Rather than signing unstructured binary blobs, Quorum builders sign <strong className="text-slate-900 font-semibold">EIP-712 Typed Structured Data</strong>. This cryptographic standard binds the builder’s identity directly to the release version, source commit, hermetic container digest, and artifact hash.
        </p>

        {/* EIP-712 Schema Fields Table */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                EIP-712 Attestation Typed Schema
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">PrimaryType: Attestation</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Field</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ATTESTATION_FIELDS.map((row) => (
                  <tr key={row.field} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-blue-600 font-semibold">
                      {row.field}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                      {row.type}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600">
                      {row.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why this matters & Storage clarifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2 text-slate-900">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold">Why EIP-712 Matters</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If an attacker modifies a single byte in the binary or switches the Git commit, the computed artifact hash changes. This invalidates the builder's cryptographic signature and prevents signature replay attacks across different chains or releases.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2 text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold">What is NOT Stored On-Chain</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Large binary files and source code repositories are <strong>never stored on-chain</strong>. The blockchain stores only lightweight cryptographic hashes, metadata references, and identity status.
            </p>
          </div>
        </div>

        {/* Network Context Banner */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3">
          <Network className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-blue-900">Current Demonstration Environment</h4>
            <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
              In this environment, Quorum connects to a local <strong>Anvil node (Chain ID: 31337)</strong> running on <code>http://127.0.0.1:8545</code>. This provides instant sub-second mining and deterministic account keys for live supply chain verification without gas costs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

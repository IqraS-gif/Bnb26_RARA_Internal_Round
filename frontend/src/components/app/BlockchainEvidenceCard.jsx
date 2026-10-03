import React, { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';

export default function BlockchainEvidenceCard({ evidence = {} }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const chainId = evidence.chain_id || 31337;
  const contracts = evidence.registry_contracts || {
    ReleaseRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    AttestationRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    BuilderRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  };

  const handleCopy = (key, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const truncateAddress = (addr) => {
    if (!addr || addr.length <= 12) return addr || '—';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Link2 className="w-4.5 h-4.5 stroke-[2]" aria-hidden="true" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Blockchain Evidence
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Attestations are recorded on-chain and can be independently verified.
          </p>
        </div>

        {/* Local Network Info Pill */}
        <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
          <span>Anvil Localnet (Chain {chainId})</span>
        </div>
      </div>

      {/* Contract & Event Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* Node Status Card */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold uppercase">
            Network
          </span>
          <div className="mt-1 flex items-center justify-between gap-1">
            <div className="min-w-0">
              <span className="font-bold text-slate-900 block truncate text-xs">
                Anvil Localnet
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Chain ID: {chainId}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>

        {/* Release Registry Card */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold uppercase">
            Release Registry
          </span>
          <div className="mt-1 flex items-center justify-between gap-1 font-mono text-[11px] text-blue-600 font-semibold">
            <span title={contracts.ReleaseRegistry}>
              {truncateAddress(contracts.ReleaseRegistry)}
            </span>
            <button
              type="button"
              onClick={() => handleCopy('releaseReg', contracts.ReleaseRegistry)}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy Release Registry address"
              aria-label="Copy Release Registry address"
            >
              {copiedKey === 'releaseReg' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Attestation Registry Card */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold uppercase">
            Attestation Registry
          </span>
          <div className="mt-1 flex items-center justify-between gap-1 font-mono text-[11px] text-blue-600 font-semibold">
            <span title={contracts.AttestationRegistry}>
              {truncateAddress(contracts.AttestationRegistry)}
            </span>
            <button
              type="button"
              onClick={() => handleCopy('attestReg', contracts.AttestationRegistry)}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy Attestation Registry address"
              aria-label="Copy Attestation Registry address"
            >
              {copiedKey === 'attestReg' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Recent Event Card */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold uppercase">
            Recent Event
          </span>
          <div className="mt-1 flex items-center justify-between gap-1 font-mono text-[11px] text-blue-600 font-semibold">
            <span>AttestationSubmitted</span>
            <button
              type="button"
              onClick={() => handleCopy('event', 'AttestationSubmitted')}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy event name"
              aria-label="Copy event name"
            >
              {copiedKey === 'event' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

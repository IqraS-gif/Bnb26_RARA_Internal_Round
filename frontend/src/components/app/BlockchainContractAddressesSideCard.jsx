import React, { useState } from 'react';
import { FileCode, Copy, Check } from 'lucide-react';

export default function BlockchainContractAddressesSideCard({ addresses, loading }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = async (addr, key) => {
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const contracts = [
    {
      name: 'BuilderRegistry',
      address: addresses?.builder_registry || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      key: 'builder',
    },
    {
      name: 'ReleaseRegistry',
      address: addresses?.release_registry || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      key: 'release',
    },
    {
      name: 'AttestationRegistry',
      address: addresses?.attestation_registry || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      key: 'attest',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileCode className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Contract Addresses
        </h2>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="space-y-3 pt-1 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {contracts.map((c) => {
            const shortAddr =
              c.address.length > 18
                ? `${c.address.substring(0, 14)}...`
                : c.address;

            return (
              <div key={c.name} className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">{c.name}</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                  <span className="text-slate-800" title={c.address}>
                    {shortAddr}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.address, c.key)}
                    className="p-0.5 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title={`Copy ${c.name} address`}
                    aria-label={`Copy ${c.name} address`}
                  >
                    {copiedKey === c.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

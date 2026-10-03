import React, { useState } from 'react';
import { Box, Users, Tag, ShieldCheck, Copy, Check } from 'lucide-react';

export default function BlockchainRegistriesBottomCard({ addresses, loading }) {
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

  const registries = [
    {
      name: 'BuilderRegistry',
      description: 'Tracks trusted builder addresses and status.',
      address: addresses?.builder_registry || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      icon: Users,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      key: 'builder_bottom',
    },
    {
      name: 'ReleaseRegistry',
      description: 'Records canonical release information.',
      address: addresses?.release_registry || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      icon: Tag,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      key: 'release_bottom',
    },
    {
      name: 'AttestationRegistry',
      description: 'Stores signed EIP-712 builder attestations.',
      address: addresses?.attestation_registry || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      icon: ShieldCheck,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      key: 'attest_bottom',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Box className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Deployed Smart Contract Registries
          </h2>
          <p className="text-xs text-slate-500">
            Smart contracts used by Quorum to record builder, release, and attestation data.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {registries.map((reg) => {
          const Icon = reg.icon;
          const shortAddr =
            reg.address.length > 22
              ? `${reg.address.substring(0, 18)}...`
              : reg.address;

          return (
            <div
              key={reg.name}
              className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${reg.iconBg} ${reg.iconColor} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {reg.name}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Deployed
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  {reg.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/50">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Contract Address
                </span>
                <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                  <span className="text-slate-800 truncate" title={reg.address}>
                    {shortAddr}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(reg.address, reg.key)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                    title={`Copy ${reg.name} contract address`}
                    aria-label={`Copy ${reg.name} contract address`}
                  >
                    {copiedKey === reg.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

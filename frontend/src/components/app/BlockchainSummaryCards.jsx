import React from 'react';
import { Box, Link2, FileCode, ShieldCheck } from 'lucide-react';

export default function BlockchainSummaryCards({ summary, loading }) {
  const cards = [
    {
      title: 'Network',
      value: summary?.network ? 'Anvil Localnet' : 'Anvil Localnet',
      subtext: 'Local Development Network',
      icon: Box,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Chain ID',
      value: summary?.chain_id ?? 31337,
      subtext: 'Development',
      icon: Link2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Registry Contracts',
      value: summary?.registry_count ?? 3,
      subtext: 'Deployed and active',
      icon: FileCode,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Attestations Recorded',
      value: summary?.attestation_count ?? 0,
      subtext: 'On-chain attestations',
      icon: ShieldCheck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4 transition-all hover:border-slate-300"
          >
            <div
              className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block truncate">
                {card.title}
              </span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-mono sm:font-sans">
                {card.value}
              </div>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

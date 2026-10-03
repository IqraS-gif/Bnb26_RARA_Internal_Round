import React from 'react';
import { Layers, Box, Tag, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

export default function BlockchainEventTypesSideCard() {
  const eventTypes = [
    {
      name: 'BuilderRegistered',
      description: 'Trusted builder added/updated',
      icon: Box,
      color: 'text-emerald-600',
    },
    {
      name: 'ReleaseRegistered',
      description: 'Release information recorded',
      icon: Tag,
      color: 'text-blue-600',
    },
    {
      name: 'AttestationSubmitted',
      description: 'Builder attestation submitted',
      icon: ShieldCheck,
      color: 'text-indigo-600',
    },
    {
      name: 'EquivocationDetected',
      description: 'Conflicting builder evidence detected',
      icon: AlertTriangle,
      color: 'text-rose-600',
    },
    {
      name: 'AttestationSuperseded',
      description: 'Attestation replaced or updated',
      icon: RefreshCw,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Event Types
        </h2>
      </div>

      {/* Legend list */}
      <div className="space-y-3 text-xs">
        {eventTypes.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-start gap-2.5">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.color}`} aria-hidden="true" />
              <div className="min-w-0">
                <span className="font-mono font-semibold text-slate-900 block text-[11px]">
                  {item.name}
                </span>
                <span className="text-slate-400 text-[11px] block leading-tight">
                  {item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

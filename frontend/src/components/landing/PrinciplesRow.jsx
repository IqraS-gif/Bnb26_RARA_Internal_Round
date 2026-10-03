import React from 'react';
import { ShieldCheck, Users, FileSearch } from 'lucide-react';

export default function PrinciplesRow() {
  const principles = [
    {
      icon: ShieldCheck,
      title: 'Reproducible Builds',
      description: 'Deterministic build environments eliminate variance.',
    },
    {
      icon: Users,
      title: 'Multiple Independent Builders',
      description: 'No single builder controls the result.',
    },
    {
      icon: FileSearch,
      title: 'Transparent and Auditable',
      description: 'All verification evidence is publicly recorded on-chain.',
    },
  ];

  return (
    <div className="w-full py-8 my-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {principles.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="flex items-start gap-3.5 px-2">
              <div className="w-11 h-11 rounded-full bg-blue-50/80 border border-blue-100/60 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs">
                <Icon className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-semibold text-slate-900 tracking-tight mb-1">
                  {p.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  {p.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

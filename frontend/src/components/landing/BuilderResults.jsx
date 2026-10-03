import React from 'react';
import { Server, CheckCircle2 } from 'lucide-react';

export default function BuilderResults() {
  const builders = [
    { name: 'Builder A', status: 'Reproducible', hash: 'bed7753055d2c...' },
    { name: 'Builder B', status: 'Reproducible', hash: 'bed7753055d2c...' },
    { name: 'Builder C', status: 'Reproducible', hash: 'bed7753055d2c...' },
  ];

  const fullHash = 'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3';

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          Builder Results
        </h4>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white stroke-[2.5]" aria-hidden="true" />
          <span>All builders produced identical artifacts</span>
        </div>
      </div>

      {/* Builder rows */}
      <div className="space-y-2">
        {builders.map((builder) => (
          <div
            key={builder.name}
            className="flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 border border-slate-100/90 rounded-xl px-3 sm:px-4 py-2.5 transition-colors duration-150"
          >
            {/* Left: Server + Name + Badge */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-600 shadow-2xs">
                <Server className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                {builder.name}
              </span>
              <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/70">
                {builder.status}
              </span>
            </div>

            {/* Middle: Shortened Hash (with full hash accessible) */}
            <div className="text-center px-2">
              <span
                className="font-mono text-[11px] text-slate-500 hidden sm:inline-block cursor-help"
                title={fullHash}
              >
                {builder.hash}
              </span>
            </div>

            {/* Right: Match indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white stroke-[2.5]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Match
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

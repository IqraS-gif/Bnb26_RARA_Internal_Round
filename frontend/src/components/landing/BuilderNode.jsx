import React from 'react';
import { Server } from 'lucide-react';

export default function BuilderNode({ name = 'Builder A', status = 'Reproducible', index = 0 }) {
  return (
    <div
      className="flex items-center gap-3.5 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
        <Server className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900 tracking-tight">
          {name}
        </span>
        <div className="flex items-center mt-0.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/70">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

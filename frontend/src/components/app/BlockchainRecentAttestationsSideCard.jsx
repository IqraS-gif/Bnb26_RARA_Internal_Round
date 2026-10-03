import React from 'react';
import { ShieldCheck, Server, ArrowRight } from 'lucide-react';

export default function BlockchainRecentAttestationsSideCard({
  attestations = [],
  loading = false,
  onSelectAttestation,
  onViewAll,
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all space-y-3.5">
      {/* Header */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Recent Attestations
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Latest builder attestations recorded on-chain.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3 pt-1 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : attestations.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No recent attestations found.
        </div>
      ) : (
        <div className="space-y-2">
          {attestations.map((att, idx) => {
            const shortTx =
              att.transaction_hash.length > 14
                ? `${att.transaction_hash.substring(0, 10)}...`
                : att.transaction_hash;

            return (
              <div
                key={att.transaction_hash + idx}
                onClick={() => onSelectAttestation && onSelectAttestation(att)}
                className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200/70 flex items-center justify-center text-slate-600 shrink-0">
                      <Server className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                      {att.builder_name}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Success
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="text-slate-400 truncate max-w-[130px]">
                    Tx: {shortTx}
                  </span>
                  <span>Block #{att.block_number}</span>
                </div>

                <div className="mt-1 text-[10px] text-slate-400">
                  {att.formatted_timestamp}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          <span>View All Attestations</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

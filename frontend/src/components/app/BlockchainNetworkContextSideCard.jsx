import React from 'react';
import { Link2, CheckCircle2, XCircle } from 'lucide-react';

export default function BlockchainNetworkContextSideCard({ summary, loading }) {
  const isConnected = summary?.rpc_status === 'Connected';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all space-y-3.5">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Network Context
        </h2>
      </div>

      {/* Attributes List */}
      {loading ? (
        <div className="space-y-3 pt-1 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
        </div>
      ) : (
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Network</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
              {summary?.network || 'Anvil Localnet (Development)'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Chain ID</span>
            <span className="font-mono font-bold text-slate-900">
              {summary?.chain_id ?? 31337}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">RPC Endpoint</span>
            <span className="font-mono text-[11px] text-slate-700 truncate max-w-[150px]">
              {summary?.rpc_url || 'http://127.0.0.1:8545'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Connection Status</span>
            <div>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Disconnected
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Latest Block</span>
            <span className="font-mono font-bold text-slate-900">
              #{summary?.current_block ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Block Time (avg)</span>
            <span className="font-medium text-slate-700">
              {summary?.block_time || '~2s'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

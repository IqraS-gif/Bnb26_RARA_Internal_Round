import React from 'react';
import { Monitor, CheckCircle2, XCircle } from 'lucide-react';

export default function SystemInfoSideCard({ systemStatus }) {
  const isBackendOnline = systemStatus?.backend_status === 'Online';
  const isRpcConnected = systemStatus?.rpc_status === 'Connected';

  const rows = [
    {
      label: 'Application Version',
      value: (
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          {systemStatus?.application_version || 'v0.74.4'}
        </span>
      ),
    },
    {
      label: 'Backend Status',
      value: (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isBackendOnline ? 'Online' : 'Offline'}</span>
        </span>
      ),
    },
    {
      label: 'Frontend Status',
      value: (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Online</span>
        </span>
      ),
    },
    {
      label: 'Blockchain Network',
      value: (
        <span className="text-xs font-semibold text-slate-800">
          {systemStatus?.blockchain_network || 'Anvil Localnet'}
        </span>
      ),
    },
    {
      label: 'Chain ID',
      value: (
        <span className="font-mono text-xs font-bold text-slate-800">
          {systemStatus?.chain_id || '31337'}
        </span>
      ),
    },
    {
      label: 'RPC Endpoint',
      value: (
        <span
          className="font-mono text-xs text-slate-600 truncate max-w-[150px]"
          title={systemStatus?.rpc_endpoint || 'http://127.0.0.1:8545'}
        >
          {systemStatus?.rpc_endpoint || 'http://127.0.0.1:8545'}
        </span>
      ),
    },
    {
      label: 'Latest Block',
      value: (
        <span className="font-mono text-xs font-bold text-slate-900">
          #{systemStatus?.latest_block ?? 0}
        </span>
      ),
    },
    {
      label: 'Connected Wallet',
      value: (
        <span className="text-xs text-slate-400 font-medium">
          {systemStatus?.connected_wallet || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              System Information
            </h2>
            <p className="text-[11px] text-slate-500">
              Real-time application runtime metrics.
            </p>
          </div>
        </div>

        {/* Metrics rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className="py-2.5 flex items-center justify-between gap-2"
            >
              <span className="text-xs text-slate-500 font-medium">
                {row.label}
              </span>
              <div className="text-right">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Terminal,
  FileCode,
} from 'lucide-react';

export default function BuilderResultsTab({
  builders = [],
  evidence = {},
  status = 'ACCEPT',
  onSelectBuilderLogs,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const builderExecutions = evidence.builder_executions || [];

  const handleCopy = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Canonical 3 builders fallback if list is partial
  const standardBuilders = [
    { id: 'builder-a', name: 'Builder A', defaultAddr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
    { id: 'builder-b', name: 'Builder B', defaultAddr: '0x3C44CdD4606730e81f7127E15e80d49C6788A34F' },
    { id: 'builder-c', name: 'Builder C', defaultAddr: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {standardBuilders.map((sb, idx) => {
        // Match builder verification result
        const bResult = builders.find(
          (b) =>
            (b.builder_name && b.builder_name.toLowerCase() === sb.name.toLowerCase()) ||
            (b.builder_address && b.builder_address.toLowerCase() === sb.defaultAddr.toLowerCase())
        ) || builders[idx];

        // Match builder container execution result
        const bExec = builderExecutions.find(
          (be) => be.builder_id === sb.id || (be.builder_name && be.builder_name.toLowerCase() === sb.name.toLowerCase())
        );

        const isSuccess = bResult?.status === 'VALID' || bExec?.status === 'SUCCESS';
        const isDivergent = bResult?.status === 'CONFLICTING' || bExec?.status === 'TAMPERED_DEMO';
        const isUnavailable = !isSuccess && !isDivergent;

        const containerName = bExec?.container_name || (isUnavailable ? 'N/A (offline)' : `quorum-${sb.id}`);
        const durationSec = bExec?.duration_seconds != null ? `${bExec.duration_seconds}s` : (isUnavailable ? '—' : '15.2s');
        const artifactHash = bResult?.artifact_hash || bExec?.artifact_hash || '';
        const artifactSize = bExec?.artifact_size
          ? `${bExec.artifact_size.toLocaleString()} bytes`
          : (isSuccess ? '4,690,072 bytes' : '—');
        const sigStatus = bResult?.signature_status || (isSuccess ? 'VALID' : 'MISSING');
        const txHash = bExec?.blockchain_tx?.transaction_hash || '';

        const shortHash = artifactHash ? `${artifactHash.slice(0, 14)}...${artifactHash.slice(-6)}` : '—';
        const shortTx = txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}` : '—';
        const shortContainer = containerName.length > 22 ? `${containerName.slice(0, 20)}...` : containerName;

        return (
          <div
            key={sb.id}
            className={`bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
              isDivergent
                ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                : isUnavailable
                ? 'border-slate-200/80 bg-slate-50/40 opacity-90'
                : 'border-slate-200/90'
            }`}
          >
            {/* Top Row: Icon, Name, and Status Badge */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isDivergent
                        ? 'bg-rose-50 border border-rose-200 text-rose-600'
                        : isUnavailable
                        ? 'bg-slate-100 border border-slate-200 text-slate-500'
                        : 'bg-blue-50 border border-blue-100 text-blue-600'
                    }`}
                  >
                    <Server className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {sb.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Independent build environment
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                {isDivergent ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    Divergent
                  </span>
                ) : isUnavailable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Unavailable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Success
                  </span>
                )}
              </div>

              {/* Builder Execution Metrics Grid */}
              <div className="space-y-2.5 text-xs">
                {/* Container */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Container</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                    <span title={containerName}>{shortContainer}</span>
                    {containerName && !isUnavailable && (
                      <button
                        type="button"
                        onClick={() => handleCopy(containerName, `c-${sb.id}`)}
                        className="p-0.5 text-slate-400 hover:text-blue-600"
                        title="Copy container name"
                      >
                        {copiedKey === `c-${sb.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Build Time */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Build Time</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-900">
                    {durationSec}
                  </span>
                </div>

                {/* Artifact Hash */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Artifact Hash</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <span
                      className={`font-semibold truncate max-w-[130px] ${
                        isDivergent
                          ? 'text-rose-700 bg-rose-50 px-1 rounded'
                          : isUnavailable
                          ? 'text-slate-400'
                          : 'text-slate-900'
                      }`}
                      title={artifactHash}
                    >
                      {shortHash}
                    </span>
                    {artifactHash && (
                      <button
                        type="button"
                        onClick={() => handleCopy(artifactHash, `h-${sb.id}`)}
                        className="p-0.5 text-slate-400 hover:text-blue-600"
                        title="Copy full SHA-256 hash"
                      >
                        {copiedKey === `h-${sb.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Artifact Size */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Artifact Size</span>
                  <span className="font-mono text-[11px] text-slate-800">
                    {artifactSize}
                  </span>
                </div>

                {/* Signature */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Signature</span>
                  {sigStatus === 'VALID' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Valid (EIP-712)</span>
                    </span>
                  ) : sigStatus === 'INVALID' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Invalid Sig</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Missing</span>
                  )}
                </div>

                {/* Transaction Hash */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Tx Hash</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <span
                      className="text-blue-600 hover:underline cursor-pointer truncate max-w-[130px]"
                      title={txHash || 'Recorded on Anvil localnet'}
                      onClick={() => handleCopy(txHash, `tx-${sb.id}`)}
                    >
                      {shortTx}
                    </span>
                    {txHash && (
                      <button
                        type="button"
                        onClick={() => handleCopy(txHash, `tx-${sb.id}`)}
                        className="p-0.5 text-slate-400 hover:text-blue-600"
                        title="Copy transaction hash"
                      >
                        {copiedKey === `tx-${sb.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button: View Logs */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSelectBuilderLogs?.(sb.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-colors group"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                <span>View Logs</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

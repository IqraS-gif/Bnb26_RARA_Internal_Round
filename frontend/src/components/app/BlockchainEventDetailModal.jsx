import React, { useState } from 'react';
import { X, Copy, Check, Link2, ShieldCheck, Box, Tag, AlertTriangle, RefreshCw } from 'lucide-react';

export default function BlockchainEventDetailModal({ event, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!event) return null;

  const handleCopy = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const getEventIcon = (name) => {
    switch (name) {
      case 'AttestationSubmitted':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'ReleaseRegistered':
        return <Tag className="w-5 h-5 text-emerald-600" />;
      case 'BuilderRegistered':
        return <Box className="w-5 h-5 text-indigo-600" />;
      case 'EquivocationDetected':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'AttestationSuperseded':
        return <RefreshCw className="w-5 h-5 text-amber-600" />;
      default:
        return <Link2 className="w-5 h-5 text-slate-600" />;
    }
  };

  const args = event.args || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
              {getEventIcon(event.event_name)}
            </div>
            <div>
              <h2 id="modal-event-title" className="text-base font-bold text-slate-900">
                {event.event_name}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {event.registry_name} &bull; Block #{event.block_number}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close event details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Top Meta Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Registry Contract</span>
              <span className="font-semibold text-slate-800">{event.registry_name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Timestamp</span>
              <span className="font-medium text-slate-800">{event.formatted_timestamp}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Block Number</span>
              <span className="font-mono font-bold text-slate-900">#{event.block_number}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {event.status}
              </span>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              Transaction Hash
            </span>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 font-mono text-xs">
              <span className="text-slate-800 break-all">{event.transaction_hash}</span>
              <button
                type="button"
                onClick={() => handleCopy(event.transaction_hash, 'tx')}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ml-2 shrink-0 cursor-pointer"
                title="Copy full transaction hash"
              >
                {copiedKey === 'tx' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Contract Address */}
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              Contract Address
            </span>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 font-mono text-xs">
              <span className="text-slate-800 break-all">{event.contract_address}</span>
              <button
                type="button"
                onClick={() => handleCopy(event.contract_address, 'addr')}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ml-2 shrink-0 cursor-pointer"
                title="Copy contract address"
              >
                {copiedKey === 'addr' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Decoded Event Parameters */}
          <div className="space-y-2 pt-2">
            <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider block">
              Decoded Event Arguments
            </span>
            <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
              {Object.entries(args).map(([k, v]) => {
                const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
                const isCopyable =
                  typeof v === 'string' &&
                  (v.startsWith('0x') || v.length > 20 || k.toLowerCase().includes('hash'));

                return (
                  <div
                    key={k}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="font-mono text-slate-500 text-[11px]">{k}</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-medium text-slate-900 break-all text-[11px]">
                        {strVal}
                      </span>
                      {isCopyable && (
                        <button
                          type="button"
                          onClick={() => handleCopy(strVal, k)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                          title={`Copy ${k}`}
                        >
                          {copiedKey === k ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

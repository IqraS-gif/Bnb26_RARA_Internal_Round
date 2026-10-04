import React, { useState } from 'react';
import {
  Database,
  History,
  Server,
  Blocks,
  Trash2,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function DataStorageCard({
  storage,
  onNavigate,
  onClearCache,
}) {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearCache = () => {
    setClearing(true);
    if (onClearCache) {
      onClearCache();
    }
    setTimeout(() => {
      setClearing(false);
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    }, 400);
  };

  const histCount = storage?.verification_count ?? 0;
  const builderCount = storage?.builder_evidence_count ?? 0;
  const eventsCount = storage?.blockchain_events_count ?? 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Data & Storage
            </h2>
            <p className="text-[11px] text-slate-500">
              Manage local application data and evidence.
            </p>
          </div>
        </div>

        {/* Data Rows */}
        <div className="space-y-3 mb-4">
          {/* Verification History */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Verification History
                </h3>
                <p className="text-[11px] text-slate-500">
                  {histCount} {histCount === 1 ? 'run' : 'verification runs'} stored
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/history')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-200 hover:text-blue-600 text-xs font-semibold text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              View
            </button>
          </div>

          {/* Builder Evidence */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Server className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Builder Evidence
                </h3>
                <p className="text-[11px] text-slate-500">
                  {builderCount} {builderCount === 1 ? 'record' : 'builder runs'} stored
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/builder-evidence')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-200 hover:text-blue-600 text-xs font-semibold text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              View
            </button>
          </div>

          {/* Blockchain Evidence */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Blocks className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Blockchain Cache
                </h3>
                <p className="text-[11px] text-slate-500">
                  {eventsCount > 0
                    ? `${eventsCount} on-chain events indexed`
                    : 'Event data cached locally'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/blockchain')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-200 hover:text-blue-600 text-xs font-semibold text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              View
            </button>
          </div>

          {/* Clear Cache */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Clear Cache
                </h3>
                <p className="text-[11px] text-slate-500">
                  Clear local blockchain query cache
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearCache}
              disabled={clearing}
              className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 rounded-lg transition-all shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-1"
            >
              {cleared ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Cleared</span>
                </>
              ) : (
                <span>Clear</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

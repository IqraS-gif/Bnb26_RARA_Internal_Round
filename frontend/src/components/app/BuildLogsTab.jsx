import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Server,
  Info,
} from 'lucide-react';

export default function BuildLogsTab({
  evidence = {},
  initialBuilder = 'builder-a',
}) {
  const [selectedBuilderId, setSelectedBuilderId] = useState(initialBuilder || 'builder-a');
  const [copied, setCopied] = useState(false);

  const builderExecutions = evidence.builder_executions || [];

  const standardBuilders = [
    { id: 'builder-a', name: 'Builder A' },
    { id: 'builder-b', name: 'Builder B' },
    { id: 'builder-c', name: 'Builder C' },
  ];

  const currentExec = builderExecutions.find(
    (be) => be.builder_id === selectedBuilderId
  ) || builderExecutions.find(
    (be) => be.builder_name?.toLowerCase().includes(selectedBuilderId.replace('builder-', ''))
  );

  const rawLogs = currentExec?.logs || '';
  const isOffline = currentExec?.status === 'FAILED' && currentExec?.logs?.includes('offline');

  const handleCopyLogs = () => {
    if (!rawLogs) return;
    try {
      navigator.clipboard?.writeText(rawLogs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Top Header & Builder Selector Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Terminal className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Docker Container Build Logs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stdout and stderr captured during reproducible container execution.
            </p>
          </div>
        </div>

        {/* Builder Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {standardBuilders.map((b) => {
            const isSelected = selectedBuilderId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBuilderId(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean White/Light Terminal View */}
      <div className="rounded-xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs text-left">
        {/* Terminal Title Bar */}
        <div className="bg-slate-50/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block shadow-2xs" />
            </div>
            <span className="font-mono text-[11px] font-semibold text-slate-600 ml-2">
              {currentExec?.container_name || `quorum-${selectedBuilderId}`} • bash
            </span>
          </div>

          {rawLogs && (
            <button
              type="button"
              onClick={handleCopyLogs}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Logs</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Terminal Body - Light Background with no horizontal scrollbar */}
        <div className="p-4 sm:p-5 font-mono text-xs text-slate-800 bg-[#fafbfc] overflow-y-auto max-h-[380px] leading-relaxed no-scrollbar">
          {rawLogs ? (
            <pre className="whitespace-pre-wrap break-all font-mono text-xs text-slate-800 selection:bg-blue-100 selection:text-blue-900 leading-relaxed">
              {rawLogs}
            </pre>
          ) : isOffline ? (
            <div className="py-10 text-center text-slate-400">
              <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="font-sans text-xs text-slate-500">
                This builder was offline in this verification run. No container was launched.
              </p>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 font-sans text-xs">
              No build logs captured for this container.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

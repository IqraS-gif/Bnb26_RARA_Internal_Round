import React, { useState } from 'react';
import { Users, Copy, Check, Info } from 'lucide-react';

export default function TrustedBuildersCard({ trustedBuilders = [] }) {
  const [copiedAddr, setCopiedAddr] = useState(null);

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const formatShort = (addr) => {
    if (!addr || addr.length < 12) return addr || '—';
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const getLetterColor = (name) => {
    if (name.includes('A')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (name.includes('B')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (name.includes('C')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getLetter = (name) => {
    if (name.includes('A')) return 'A';
    if (name.includes('B')) return 'B';
    if (name.includes('C')) return 'C';
    return name.charAt(0) || 'B';
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Trusted Builders
            </h2>
            <p className="text-[11px] text-slate-500">
              Configure trusted builder identities and settings.
            </p>
          </div>
        </div>

        {/* Builders List */}
        <div className="space-y-3 mb-4">
          {trustedBuilders.map((b) => {
            const isCopied = copiedAddr === b.address;
            const letter = getLetter(b.name);
            const letterStyle = getLetterColor(b.name);

            return (
              <div
                key={b.address}
                className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${letterStyle}`}
                  >
                    {letter}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {b.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-500" title={b.address}>
                        {formatShort(b.address)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(b.address)}
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Copy builder address"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </span>

                  {/* Read-only Toggle indicator matching visual style */}
                  <div
                    className="w-9 h-5 rounded-full bg-blue-600 flex items-center justify-end px-0.5 shadow-2xs cursor-default"
                    title="Active in local trust policy and on-chain registry"
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note banner */}
      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 mt-2">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          Only active builders are considered during verification runs.
        </span>
      </div>
    </div>
  );
}

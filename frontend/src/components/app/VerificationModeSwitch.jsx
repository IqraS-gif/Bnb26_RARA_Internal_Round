import React from 'react';
import { Box, Link2 } from 'lucide-react';

export default function VerificationModeSwitch({
  activeMode = 'demo', // 'demo' | 'arbitrary'
  onSelectMode,
  disabled = false,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Option 1: Selected Release (Demo) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelectMode && onSelectMode('demo')}
        className={`text-left p-4 rounded-2xl border transition-all duration-150 relative ${
          activeMode === 'demo'
            ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              activeMode === 'demo'
                ? 'bg-white text-blue-600 border border-blue-200 shadow-2xs'
                : 'bg-slate-50 text-slate-500 border border-slate-200/70'
            }`}
          >
            <Box className="w-5 h-5 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className={`text-sm font-bold tracking-tight ${
                  activeMode === 'demo' ? 'text-slate-900' : 'text-slate-800'
                }`}
              >
                Selected Release (Demo)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Use the pre-configured <span className="font-semibold text-slate-700">fzf</span> repository (recommended)
            </p>
          </div>
        </div>
      </button>

      {/* Option 2: Arbitrary Repository */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelectMode && onSelectMode('arbitrary')}
        className={`text-left p-4 rounded-2xl border transition-all duration-150 relative ${
          activeMode === 'arbitrary'
            ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              activeMode === 'arbitrary'
                ? 'bg-white text-blue-600 border border-blue-200 shadow-2xs'
                : 'bg-slate-50 text-slate-500 border border-slate-200/70'
            }`}
          >
            <Link2 className="w-5 h-5 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className={`text-sm font-bold tracking-tight ${
                  activeMode === 'arbitrary' ? 'text-slate-900' : 'text-slate-800'
                }`}
              >
                Arbitrary Repository
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Enter any supported public GitHub repository and release tag
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

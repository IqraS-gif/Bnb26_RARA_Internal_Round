import React from 'react';
import { Tag, GitCommit, Server, CheckCircle2, Box } from 'lucide-react';

export default function ProcessIllustration({ step = 1 }) {
  if (step === 1) {
    // Step 1: Fetch Source (Browser window + GitHub repo + Tag & Commit pills)
    return (
      <div className="w-full relative py-2 flex items-center justify-center">
        {/* Mini Browser / Repo Container */}
        <div className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden shadow-xs relative">
          {/* Browser Header Bar */}
          <div className="h-6 bg-slate-100/90 border-b border-slate-200/80 px-2.5 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          </div>

          {/* Repo Body Area */}
          <div className="p-3 pb-8 relative">
            <div className="flex items-center gap-2.5 mb-2.5">
              {/* GitHub Mark */}
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-2 w-3/4 bg-slate-200/90 rounded-full" />
                <div className="h-1.5 w-1/2 bg-slate-200/60 rounded-full" />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <div className="h-1.5 w-full bg-slate-200/50 rounded-full" />
              <div className="h-1.5 w-5/6 bg-slate-200/40 rounded-full" />
            </div>
          </div>

          {/* Overlaid Release Card matching reference */}
          <div className="absolute right-2 -bottom-2 bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-md space-y-1.5 z-10 w-[145px]">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 text-[11px] text-slate-700">
              <Tag className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="font-mono font-medium">v0.74.4</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 text-[10px] text-slate-700">
              <GitCommit className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="font-mono truncate">a140afeb4d733...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    // Step 2: Independent Builds (3 Builder nodes with connector curves)
    return (
      <div className="w-full relative py-1 flex items-center justify-center">
        <div className="relative w-full flex items-center justify-center">
          
          {/* Branching SVG Lines (Left) */}
          <div className="w-6 h-32 shrink-0 pointer-events-none">
            <svg viewBox="0 0 24 128" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d="M 0 64 C 12 64, 12 18, 24 18" fill="none" stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" />
              <path d="M 0 64 L 24 64" fill="none" stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" />
              <path d="M 0 64 C 12 64, 12 110, 24 110" fill="none" stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>

          {/* 3 Builder Nodes Stack */}
          <div className="flex-1 max-w-[145px] space-y-2.5 z-10">
            {['Builder A', 'Builder B', 'Builder C'].map((builder) => (
              <div
                key={builder}
                className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 tracking-tight">
                    {builder}
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white stroke-[2.5]" />
                </div>
              </div>
            ))}
          </div>

          {/* Branching SVG Lines (Right) */}
          <div className="w-6 h-32 shrink-0 pointer-events-none">
            <svg viewBox="0 0 24 128" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d="M 0 18 C 12 18, 12 64, 24 64" fill="none" stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" />
              <path d="M 0 64 L 24 64" fill="none" stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" />
              <path d="M 0 110 C 12 110, 12 64, 24 64" fill="none" stroke="#60a5fa" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>

        </div>
      </div>
    );
  }

  if (step === 3) {
    // Step 3: Compare Artifacts (Hash Box + 3 Match Rows)
    return (
      <div className="w-full relative py-1 flex flex-col items-center">
        <div className="w-full bg-slate-50/70 border border-slate-100 rounded-xl p-3 shadow-xs">
          {/* Top Blue Cube Icon */}
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 mb-2 shadow-xs">
            <Box className="w-4 h-4 stroke-[2]" />
          </div>

          {/* SHA-256 Hash Display */}
          <div className="bg-white border border-slate-100 rounded-lg p-1.5 mb-2.5 text-[9px] font-mono text-slate-500 break-all leading-tight">
            bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3
          </div>

          {/* Matches List */}
          <div className="space-y-1.5">
            {['Builder A', 'Builder B', 'Builder C'].map((builder) => (
              <div key={builder} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">{builder}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-800">Match</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    // Step 4: Record On-Chain (3D Isometric Stacked Blocks + Evidence Overlay)
    return (
      <div className="w-full relative py-1 flex items-center justify-center">
        <div className="relative w-full h-[155px] flex items-center justify-center">
          
          {/* 3D Stacked Blockchain Blocks & Pedestal */}
          <div className="absolute left-1 top-2 w-24 h-32 pointer-events-none">
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
              {/* Bottom Pedestal */}
              <polygon points="50,110 85,95 50,80 15,95" fill="#e0f2fe" opacity="0.8" />
              <polygon points="15,95 50,110 50,116 15,101" fill="#bae6fd" />
              <polygon points="50,110 85,95 85,101 50,116" fill="#7dd3fc" />

              {/* Lower Left Cube */}
              <polygon points="30,70 50,60 30,50 10,60" fill="#93c5fd" opacity="0.85" />
              <polygon points="10,60 30,70 30,85 10,75" fill="#60a5fa" opacity="0.8" />
              <polygon points="30,70 50,60 50,75 30,85" fill="#3b82f6" opacity="0.8" />

              {/* Lower Right Cube */}
              <polygon points="70,70 90,60 70,50 50,60" fill="#bae6fd" opacity="0.85" />
              <polygon points="50,60 70,70 70,85 50,75" fill="#93c5fd" opacity="0.8" />
              <polygon points="70,70 90,60 90,75 70,85" fill="#60a5fa" opacity="0.8" />

              {/* Top Central Cube */}
              <polygon points="50,45 70,35 50,25 30,35" fill="#bfdbfe" opacity="0.9" />
              <polygon points="30,35 50,45 50,60 30,50" fill="#60a5fa" opacity="0.9" />
              <polygon points="50,45 70,35 70,50 50,60" fill="#3b82f6" opacity="0.9" />
            </svg>
          </div>

          {/* Overlaid Evidence Card */}
          <div className="absolute right-1 top-2 bg-white/95 border border-slate-100 rounded-xl p-2.5 shadow-md space-y-2 z-10 w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-800">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white stroke-[2.5]" />
              </div>
              <span className="truncate">Build Evidence</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-800">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white stroke-[2.5]" />
              </div>
              <span className="truncate">Attestations</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-800">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white stroke-[2.5]" />
              </div>
              <span className="truncate">Builder Metadata</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-800">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white stroke-[2.5]" />
              </div>
              <span className="truncate">Immutable Record</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}

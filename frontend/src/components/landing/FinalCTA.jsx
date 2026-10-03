import React from 'react';
import { ArrowRight, ExternalLink, Server, CheckCircle2, AlertCircle, XCircle, Box, ShieldCheck, FileText } from 'lucide-react';

export default function FinalCTA({ onNavigate }) {
  const hashA = 'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3';
  const hashC = '3010ad9c3c9dd74a459df2d00481949b26bad298bd8d8cbd2a0ef26aa5767801';

  const handleGoToVerify = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('/verify');
    }
  };

  return (
    <section id="about" className="scroll-mt-24 w-full pt-6 pb-16 bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================== */}
        {/* PALE BLUE FINAL CTA BANNER */}
        {/* ==================================================== */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-50/80 via-slate-50/50 to-indigo-50/60 border border-blue-100/90 p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden">
          
          {/* Subtle background decorative grid */}
          <div 
            className="absolute inset-0 opacity-[0.25] rounded-3xl pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
            
            {/* ==================================================== */}
            {/* LEFT COLUMN: HEADLINE, COPY & BUTTONS (6 cols) */}
            {/* ==================================================== */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-slate-500 uppercase block mb-2.5">
                READY TO VERIFY?
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-4">
                Try It Yourself.<br />
                Verify <span className="text-blue-600">Any Release.</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-lg">
                Explore real verification results with our fzf v0.74.4 demo, or see how Quorum is designed to extend verification to other supported open source releases.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <a
                  href="/verify"
                  onClick={handleGoToVerify}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-xs hover:shadow hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Go to Verification
                  <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
                </a>

                <a
                  href="https://github.com/junegunn/fzf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm sm:text-base rounded-xl border border-slate-200/90 shadow-2xs hover:shadow hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none group"
                  aria-label="View fzf repository on GitHub (opens in new tab)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-900" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* ==================================================== */}
            {/* CENTER DECORATIVE ICONS (1 col on lg, hidden on mobile) */}
            {/* ==================================================== */}
            <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center space-y-4 py-2">
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <Box className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <ShieldCheck className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <FileText className="w-4 h-4 stroke-[2]" />
              </div>
            </div>

            {/* ==================================================== */}
            {/* RIGHT COLUMN: EVIDENCE VISUAL CARD (5 cols) */}
            {/* ==================================================== */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                
                {/* Mini Browser Bar */}
                <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>

                {/* Repo Header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-xs truncate block">junegunn/fzf</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate block">v0.74.4 · a140afeb4d733...</span>
                  </div>
                </div>

                {/* 3 Builder Rows */}
                <div className="space-y-1.5 mb-3">
                  {/* Builder A */}
                  <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-semibold text-slate-800 text-[11px]">Builder A</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                      <span>Match</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 hidden xs:inline" title={hashA}>
                      bed7753055d2c...
                    </span>
                  </div>

                  {/* Builder B */}
                  <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-semibold text-slate-800 text-[11px]">Builder B</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                      <span>Match</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 hidden xs:inline" title={hashA}>
                      bed7753055d2c...
                    </span>
                  </div>

                  {/* Builder C */}
                  <div className="flex items-center justify-between bg-rose-50/40 border border-rose-100 rounded-lg px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-semibold text-slate-800 text-[11px]">Builder C</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-rose-700">
                      <AlertCircle className="w-3.5 h-3.5 fill-rose-500 text-white" />
                      <span>Different</span>
                    </div>
                    <span className="font-mono text-[10px] text-rose-700 hidden xs:inline" title={hashC}>
                      3010ad9c3c9d...
                    </span>
                  </div>
                </div>

                {/* Verdict Box */}
                <div className="bg-rose-50/90 border border-rose-200/70 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-600">
                    <XCircle className="w-3.5 h-3.5 fill-rose-600 text-white" />
                    <span className="font-extrabold text-xs tracking-wider uppercase">REJECT</span>
                  </div>
                  <p className="text-[10px] font-medium text-rose-600/90 mt-0.5">
                    Artifacts do not match
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

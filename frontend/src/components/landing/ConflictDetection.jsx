import React from 'react';
import { Search, Shield, FileText, ExternalLink, Server, Box, CheckCircle2, AlertCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function ConflictDetection() {
  const features = [
    {
      icon: Search,
      iconBg: 'bg-rose-50 text-rose-500 border-rose-100/80',
      title: 'Detects Discrepancies',
      description: 'Surfaces when builders produce different artifacts from the same source.',
    },
    {
      icon: Shield,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100/80',
      title: 'Prevents Silent Supply Chain Risks',
      description: 'Helps you catch tampered or non-reproducible builds early.',
    },
    {
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100/80',
      title: 'Transparent Evidence',
      description: 'See exactly which builder differs and compare the artifacts.',
    },
  ];

  const hashA = 'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3';
  const hashC = '3010ad9c3c9dd74a459df2d00481949b26bad298bd8d8cbd2a0ef26aa5767801';

  return (
    <section id="builders" className="scroll-mt-24 w-full pt-14 pb-20 border-t border-slate-100 bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================== */}
        {/* MAIN TWO-COLUMN SECTION */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-12">
          
          {/* LEFT SIDE: Heading & 3 Benefit Points */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-slate-500 uppercase block mb-2.5">
              WHEN BUILDERS DISAGREE
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
              One Difference.<br />
              Visible Before<br />
              <span className="text-blue-600">You Trust It.</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-md">
              If even one builder produces a different artifact, Quorum detects the divergence and surfaces it before you trust the release.
            </p>

            {/* 3 Evidence Points */}
            <div className="space-y-4 w-full">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-full ${feat.iconBg} border flex items-center justify-center shrink-0 shadow-2xs`}>
                      <Icon className="w-4.5 h-4.5 stroke-[2]" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: Conflict Detected Evidence Panel */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.07)] transition-all duration-300">
              
              {/* Header: Repository & Exact Commit */}
              <div className="flex items-start gap-3.5 mb-5 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <a
                      href="https://github.com/junegunn/fzf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1 group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
                      aria-label="Open junegunn/fzf repository on GitHub (opens in new tab)"
                    >
                      junegunn/fzf
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">v0.74.4</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-[11px] text-slate-500 truncate" title="a140afeb4d733cad3c96a56bf6db7e26853b6757">
                      a140afeb4d733cad3c96a56bf6db7e26853b6757
                    </span>
                  </div>
                </div>
              </div>

              {/* Conflict Layout: Left Builder Cards vs Right Verdict & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative">
                
                {/* 3 Builder Evidence Cards (7 cols on md) */}
                <div className="md:col-span-7 space-y-3">
                  
                  {/* Builder A */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 shadow-2xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200/70 flex items-center justify-center text-slate-600">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Builder A</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                        Reproducible
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-100/90 rounded-lg p-2 text-[10px] font-mono text-slate-600">
                      <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate" title={hashA}>bed7753055d2c42d9c89e... 5959b9ac770a3</span>
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0 ml-auto" />
                    </div>
                  </div>

                  {/* Builder B */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 shadow-2xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200/70 flex items-center justify-center text-slate-600">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Builder B</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                        Reproducible
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-100/90 rounded-lg p-2 text-[10px] font-mono text-slate-600">
                      <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate" title={hashA}>bed7753055d2c42d9c89e... 5959b9ac770a3</span>
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0 ml-auto" />
                    </div>
                  </div>

                  {/* Builder C (Divergent) */}
                  <div className="bg-rose-50/30 border border-rose-100/90 rounded-xl p-3 shadow-2xs hover:bg-rose-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white border border-rose-200/70 flex items-center justify-center text-slate-600">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">Builder C</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                        Divergent
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-rose-100 rounded-lg p-2 text-[10px] font-mono text-rose-800">
                      <Box className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate" title={hashC}>3010ad9c8f4e1b77d9a2c... 84e2d1f996a1</span>
                      <AlertCircle className="w-3.5 h-3.5 fill-rose-500 text-white shrink-0 ml-auto" />
                    </div>
                  </div>

                </div>

                {/* Right Verdict & Comparison Summary (5 cols on md) */}
                <div className="md:col-span-5 flex flex-col justify-between bg-slate-50/60 border border-slate-100 rounded-xl p-4 shadow-2xs">
                  
                  {/* Conflict Detected header */}
                  <div>
                    <div className="flex items-start gap-2.5 mb-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 stroke-[2]" aria-hidden="true" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                          Conflict Detected
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          2 out of 3 builders produced matching artifacts.
                        </p>
                      </div>
                    </div>

                    {/* Prominent REJECT Verdict */}
                    <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl p-3 text-center my-2.5">
                      <div className="flex items-center justify-center gap-1.5 text-rose-600">
                        <XCircle className="w-4 h-4 fill-rose-600 text-white" aria-hidden="true" />
                        <span className="font-extrabold text-sm tracking-wider uppercase">REJECT</span>
                      </div>
                      <p className="text-[11px] font-medium text-rose-600/90 mt-0.5">
                        Artifacts do not match
                      </p>
                    </div>
                  </div>

                  {/* Comparison Summary */}
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <h5 className="text-[11px] font-bold text-slate-800 mb-2">
                      Comparison Summary
                    </h5>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Builder A</span>
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white" />
                          <span>bed77530...</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Builder B</span>
                        <div className="flex items-center gap-1 text-slate-600 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white" />
                          <span>bed77530...</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">Builder C</span>
                        <div className="flex items-center gap-1 text-rose-700 font-mono text-[10px]">
                          <AlertCircle className="w-3 h-3 fill-rose-500 text-white" />
                          <span>3010ad9c...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* IMPORTANT LIMITATION STRIP */}
        {/* ==================================================== */}
        <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Info className="w-5 h-5 stroke-[2]" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
              Important Limitation
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
              Quorum verifies agreement between trusted builders. It does not guarantee that a majority is honest, that the source code is correct, or that the software is free from malicious intent.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

import React from 'react';
import { Box, Users, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import EvidencePanel from './EvidencePanel';

export default function LiveVerification({ onNavigate }) {
  const features = [
    {
      icon: Box,
      title: 'Real Open Source Project',
      description: 'fzf v0.74.4 from GitHub.',
    },
    {
      icon: Users,
      title: 'Independent Builders',
      description: 'Three trusted builders reproduce from the same source.',
    },
    {
      icon: CheckCircle2,
      title: 'Identical Artifacts',
      description: 'All builders produce the same SHA-256 hash.',
    },
    {
      icon: FileText,
      title: 'On-Chain Evidence',
      description: 'Attestations are recorded for an immutable audit trail.',
    },
  ];

  const handleGoToVerify = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('/verify');
    }
  };

  return (
    <section id="live-demo" className="scroll-mt-24 w-full pt-14 pb-20 border-t border-slate-100 bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================== */}
        {/* TWO-COLUMN GRID: LEFT COPY & RIGHT EVIDENCE PANEL */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-14">
          
          {/* LEFT SIDE: Heading & 4 Feature Points */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-slate-500 uppercase block mb-2.5">
              REAL-WORLD EXAMPLE
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
              A Live Verification<br />
              You Can <span className="text-blue-600">See</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-md">
              Explore a real, reproducible open source release verified across three independent builders. This is the same fzf v0.74.4 demonstration used in our controlled attack scenario.
            </p>

            {/* 4 Feature Points List */}
            <div className="space-y-4 w-full">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50/80 border border-blue-100/60 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs">
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

          {/* RIGHT SIDE: Real Evidence Panel */}
          <div className="lg:col-span-7 w-full">
            <EvidencePanel />
          </div>

        </div>

        {/* ==================================================== */}
        {/* BOTTOM CTA BANNER: TRY IT YOURSELF */}
        {/* ==================================================== */}
        <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Box className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase block mb-1">
                WANT TO VERIFY ANOTHER RELEASE?
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-1">
                Try It Yourself
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Verify any supported open source release and see the real results from trusted builders.
              </p>
            </div>
          </div>

          <a
            href="/verify"
            onClick={handleGoToVerify}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none shrink-0 w-full sm:w-auto"
          >
            Go to Verification
            <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
}

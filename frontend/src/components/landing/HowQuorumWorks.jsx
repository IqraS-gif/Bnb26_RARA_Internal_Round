import React from 'react';
import { ArrowRight, ArrowDown, Box } from 'lucide-react';
import ProcessStep from './ProcessStep';
import PrinciplesRow from './PrinciplesRow';

export default function HowQuorumWorks() {
  const steps = [
    {
      stepNumber: 1,
      title: 'Fetch Source',
      description: 'Pull the exact source code at the specified release tag or commit.',
    },
    {
      stepNumber: 2,
      title: 'Independent Builds',
      description: 'Multiple trusted builders compile the source code in deterministic environments.',
    },
    {
      stepNumber: 3,
      title: 'Compare Artifacts',
      description: 'Cryptographically verify that all builders produce identical artifacts.',
    },
    {
      stepNumber: 4,
      title: 'Record On-Chain',
      description: 'Store the verification result and metadata on the blockchain for an immutable audit trail.',
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 w-full pt-14 pb-20 border-t border-slate-100 bg-[#fafbfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================== */}
        {/* SECTION HEADER */}
        {/* ==================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 animate-fade-in-up">
          <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-slate-500 uppercase block mb-2">
            THE PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3.5">
            How Quorum Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            From source code to an on-chain record, Quorum verifies that open source releases are reproducible across multiple independent builders.
          </p>
        </div>

        {/* ==================================================== */}
        {/* 4 PROCESS CARDS WITH CONNECTORS */}
        {/* ==================================================== */}
        <div className="relative">
          {/* Desktop 4-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6 items-stretch relative">
            {steps.map((step, index) => (
              <React.Fragment key={step.stepNumber}>
                <div className="relative h-full">
                  <ProcessStep
                    stepNumber={step.stepNumber}
                    title={step.title}
                    description={step.description}
                    delay={index * 120}
                  />
                  {/* Subtle connector arrow between cards */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none">
                      <ArrowRight className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Tablet (2x2) & Mobile (1 column) Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
            {steps.map((step, index) => (
              <div key={step.stepNumber} className="flex flex-col items-center">
                <div className="w-full">
                  <ProcessStep
                    stepNumber={step.stepNumber}
                    title={step.title}
                    description={step.description}
                    delay={index * 100}
                  />
                </div>
                {/* Downward indicator on mobile */}
                {index < steps.length - 1 && (
                  <div className="my-2 md:hidden text-slate-400">
                    <ArrowDown className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ==================================================== */}
        {/* SUPPORTING PRINCIPLES ROW */}
        {/* ==================================================== */}
        <PrinciplesRow />

        {/* ==================================================== */}
        {/* FINAL CTA STRIP */}
        {/* ==================================================== */}
        <div className="mt-6 bg-blue-50/70 border border-blue-100/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Box className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1">
                See a real verification
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Explore a live example with the fzf v0.74.4 release, verified across three independent builders.
              </p>
            </div>
          </div>

          <a
            href="/verify"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none shrink-0 w-full sm:w-auto"
          >
            View a Live Demo
            <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
}

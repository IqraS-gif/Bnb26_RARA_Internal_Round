import React from 'react';
import { ArrowRight } from 'lucide-react';
import VerificationNetwork from './VerificationNetwork';

export default function HeroSection({ onNavigate }) {
  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  };

  const handleGoToVerify = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('/verify');
    }
  };

  return (
    <section id="hero" className="scroll-mt-24 relative pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ==================================================== */}
          {/* LEFT HERO: MESSAGING & CTAs (5 columns on desktop) */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 flex flex-col items-start text-left animate-fade-in-up">
            {/* Eyebrow */}
            <div className="inline-block mb-4">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                OPEN SOURCE. INDEPENDENTLY VERIFIED.
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
              Stronger Trust<br />
              for <span className="text-blue-600">Open Source.</span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg mb-8">
              Quorum independently verifies that open source releases are reproducible across multiple trusted builders and records the results on-chain.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <a
                href="#how-it-works"
                onClick={handleScrollToHowItWorks}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Explore How It Works
                <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
              </a>

              <a
                href="/verify"
                onClick={handleGoToVerify}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm sm:text-base rounded-xl border border-slate-200/90 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                View a Live Demo
              </a>
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT HERO: VERIFICATION NETWORK VISUAL (7 cols) */}
          {/* ==================================================== */}
          <div className="lg:col-span-7 flex items-center justify-center w-full animate-fade-in">
            <VerificationNetwork />
          </div>

        </div>
      </div>
    </section>
  );
}

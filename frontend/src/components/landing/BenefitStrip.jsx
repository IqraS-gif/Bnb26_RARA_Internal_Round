import React from 'react';
import { Shield, Users, Box } from 'lucide-react';

export default function BenefitStrip() {
  const benefits = [
    {
      icon: Shield,
      title: 'Independent Verification',
      description: 'Multiple trusted builders reproduce the same artifact from source.',
    },
    {
      icon: Users,
      title: 'On-Chain Transparency',
      description: 'Verification results are recorded on-chain for a permanent, immutable audit trail.',
    },
    {
      icon: Box,
      title: 'Detect Divergence',
      description: 'Conflicting artifact hashes surface reproducibility discrepancies and build stronger trust.',
    },
  ];

  return (
    <section aria-label="Key Benefits" className="w-full pt-10 pb-12 mt-4 sm:mt-8 border-t border-slate-100/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 3-Column Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className={`flex items-start gap-4 px-2 sm:px-6 lg:px-8 ${
                  index !== 0 ? 'md:border-l md:border-slate-100' : ''
                }`}
              >
                {/* Circular Icon Container */}
                <div className="w-12 h-12 rounded-full bg-blue-50/80 border border-blue-100/60 flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
                  <Icon className="w-6 h-6 stroke-[1.75]" aria-hidden="true" />
                </div>

                {/* Content */}
                <div className="flex flex-col">
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative Divider & Trust Subtitle */}
        <div className="mt-14 flex flex-col items-center justify-center">
          <div className="w-12 h-1 bg-blue-500 rounded-full mb-6 opacity-90" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase text-center">
            Trusted by developers, builders and security researchers
          </p>
        </div>

      </div>
    </section>
  );
}

import React from 'react';
import { Loader2, Info } from 'lucide-react';

export default function VerificationPipeline() {
  const steps = [
    {
      id: 1,
      title: 'Verify release tag',
      description: 'Confirming the release tag exists and fetching metadata.',
      status: 'In progress...',
    },
    {
      id: 2,
      title: 'Resolve source commit',
      description: 'Resolving the exact source commit from the tag.',
      status: 'Pending...',
    },
    {
      id: 3,
      title: 'Fetch builder attestations',
      description: 'Reading attestations from all trusted builders.',
      status: 'Pending...',
    },
    {
      id: 4,
      title: 'Verify signatures',
      description: 'Verifying EIP-712 signatures and builder identities.',
      status: 'Pending...',
    },
    {
      id: 5,
      title: 'Compare artifact hashes',
      description: 'Checking that all builders produced the same artifact hash.',
      status: 'Pending...',
    },
    {
      id: 6,
      title: 'Evaluate quorum policy',
      description: 'Applying trusted builder policy rules.',
      status: 'Pending...',
    },
    {
      id: 7,
      title: 'Read blockchain evidence',
      description: 'Fetching on-chain records and verifying events.',
      status: 'Pending...',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6 animate-fade-in">
      
      {/* Top Header Row with Spinner */}
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Verifying Release...
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
            This may take a few moments while we fetch attestations, verify signatures, and compare artifacts.
          </p>
        </div>
      </div>

      {/* Indeterminate Animated Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 left-0 bg-blue-600 rounded-full animate-progress-indeterminate w-1/2"
            role="progressbar"
            aria-label="Verification in progress"
          />
        </div>
      </div>

      {/* Verification Pipeline Static Informational Checklist */}
      <div className="relative pl-3 pt-2 pb-1 space-y-5">
        {/* Vertical Connector Line */}
        <div
          className="absolute left-[21px] top-4 bottom-5 w-0.5 bg-slate-200"
          aria-hidden="true"
        />

        {steps.map((step, idx) => {
          const isFirst = idx === 0;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Step Circle Indicator */}
              <div
                className={`relative z-10 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isFirst
                    ? 'bg-white border-2 border-blue-600 shadow-2xs'
                    : 'bg-white border-2 border-slate-300'
                }`}
                aria-hidden="true"
              >
                {isFirst ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                )}
              </div>

              {/* Step Details & Status Label */}
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isFirst ? 'text-blue-700' : 'text-slate-800'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <span
                  className={`text-[11px] font-mono shrink-0 self-start sm:self-auto ${
                    isFirst ? 'text-blue-600 font-medium' : 'text-slate-400'
                  }`}
                >
                  {step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Informational Callout */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Please keep this window open. Do not refresh or close the page while verification is running.
        </p>
      </div>

    </div>
  );
}

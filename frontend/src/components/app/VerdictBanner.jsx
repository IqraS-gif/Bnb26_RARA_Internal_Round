import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Users, FileCheck, ShieldAlert } from 'lucide-react';

export default function VerdictBanner({
  status = 'ACCEPT',
  validCount = 3,
  trustedCount = 3,
  conflictingCount = 0,
  agreedHash = null,
}) {
  const isAccept = status === 'ACCEPT';
  const isWarning = status === 'ACCEPT_WITH_WARNING';
  const isReject = status === 'REJECT';

  if (isReject) {
    const displayedConflicting = conflictingCount > 0 ? conflictingCount : 1;
    return (
      <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <XCircle className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                REJECT
              </h2>
              <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                Trusted builders produced conflicting artifacts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-rose-200/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-base font-extrabold text-rose-900 block leading-tight">
                  {validCount} / {trustedCount}
                </span>
                <span className="text-[11px] text-rose-700 font-medium">Builders Agree</span>
              </div>
            </div>

            <div className="w-px h-10 bg-rose-200/80 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-base font-extrabold text-rose-900 block leading-tight">
                  {displayedConflicting} / {trustedCount}
                </span>
                <span className="text-[11px] text-rose-700 font-medium">Conflicting Artifact</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl font-black text-amber-950 tracking-tight">
                  ACCEPT WITH WARNING
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                  Threshold Met
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed max-w-xl">
                Quorum threshold was reached with matching builders, but one or more trusted builders were unavailable or inactive.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-base font-extrabold text-amber-950 block leading-tight">
                  {validCount} / {trustedCount}
                </span>
                <span className="text-[11px] text-amber-800 font-medium">Builders Agree</span>
              </div>
            </div>

            <div className="w-px h-10 bg-amber-200/80 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-base font-extrabold text-amber-950 block leading-tight">
                  Identical
                </span>
                <span className="text-[11px] text-amber-800 font-medium">Artifact Hash</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: ACCEPT
  return (
    <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Verdict & Text */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              ACCEPT
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
              All trusted builders produced the same artifact.
            </p>
          </div>
        </div>

        {/* Right Stats Block */}
        <div className="flex items-center gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-emerald-200/80">
          {/* Stat 1: Builders Agree */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-base font-extrabold text-emerald-950 block leading-tight">
                {validCount} / {trustedCount}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Builders Agree</span>
            </div>
          </div>

          <div className="w-px h-10 bg-emerald-200/80 hidden sm:block" />

          {/* Stat 2: Identical Artifact Hash */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-base font-extrabold text-emerald-950 block leading-tight">
                Identical
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Artifact Hash</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

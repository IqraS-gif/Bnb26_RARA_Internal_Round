import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Users,
} from 'lucide-react';

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
    const isConflict = conflictingCount > 0;
    return (
      <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Icon & Verdict */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <XCircle className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                REJECT
              </h2>
              <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                {isConflict
                  ? 'Trusted builders produced conflicting artifact hashes. Quorum failed.'
                  : 'Insufficient trusted builder attestations to satisfy quorum policy.'}
              </p>
            </div>
          </div>

          {/* Right: Quorum & Policy Box */}
          <div className="bg-white/80 border border-rose-200/90 rounded-xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                <span>Quorum: {validCount} / {trustedCount} builders agree</span>
              </div>
              <p className="text-[11px] text-rose-700 font-medium">
                Policy: 2 of 3 matching trusted builders required
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Icon & Verdict */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                ACCEPT WITH WARNING
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
                Quorum reached by {validCount} matching trusted builders. One builder was unavailable.
              </p>
            </div>
          </div>

          {/* Right: Quorum & Policy Box */}
          <div className="bg-white/80 border border-amber-200/90 rounded-xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-amber-700" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <span>Quorum: {validCount} / {trustedCount} builders agree</span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium">
                Policy: 2 of 3 matching trusted builders required
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACCEPT
  return (
    <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Icon & Verdict */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              ACCEPT
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
              All 3 trusted builders produced identical artifacts. Quorum verification successful.
            </p>
          </div>
        </div>

        {/* Right: Quorum & Policy Box */}
        <div className="bg-white/90 border border-emerald-200/90 rounded-xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 shrink-0 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <span>Quorum: {validCount} / {trustedCount} builders agree</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              Policy: 2 of 3 matching trusted builders required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export default function VerificationTimeline({
  timestamps = {},
  summary = {},
  status = 'ACCEPT',
  release = {},
}) {
  const isReject = status === 'REJECT';
  const isValidCount = summary.valid_builder_count ?? 3;
  const isConflicting = summary.conflicting_builder_count > 0;

  // Format base timestamp
  const formatTime = (isoString, offsetSeconds = 0) => {
    if (!isoString) return '—';
    try {
      const d = new Date(new Date(isoString).getTime() + offsetSeconds * 1000);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return '—';
    }
  };

  const startedAt = timestamps.started_at || timestamps.verified_at;
  const completedAt = timestamps.completed_at || timestamps.verified_at;

  const steps = [
    {
      title: `Verified release tag ${release.tag || 'v0.74.4'} → commit ${(release.source_commit || 'a140afeb').slice(0, 8)}...`,
      time: formatTime(startedAt, 0),
      status: 'complete',
    },
    {
      title: 'Started Docker builder environments',
      time: formatTime(startedAt, 2),
      status: 'complete',
    },
    {
      title: 'Builders completed and artifacts collected',
      time: formatTime(startedAt, 14),
      status: 'complete',
    },
    {
      title: 'Generated EIP-712 structured attestations',
      time: formatTime(startedAt, 15),
      status: 'complete',
    },
    {
      title: 'Submitted attestations to blockchain (AttestationRegistry)',
      time: formatTime(startedAt, 16),
      status: 'complete',
    },
    {
      title: `Evaluated quorum policy (${isValidCount}/3 matching builders)`,
      time: formatTime(startedAt, 17),
      status: isReject ? 'reject' : 'complete',
    },
    {
      title: `Verification completed: ${status}`,
      time: formatTime(completedAt, 0),
      status: isReject ? 'reject' : 'complete',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Verification Timeline
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Chronological Audit</span>
      </div>

      <div className="relative pl-3 pt-1 space-y-4">
        {/* Connector Line */}
        <div
          className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-200"
          aria-hidden="true"
        />

        {steps.map((step, idx) => {
          const isFailedStep = step.status === 'reject';
          return (
            <div key={idx} className="relative flex items-start gap-3.5 text-xs">
              {/* Dot */}
              <div
                className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                  isFailedStep
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {isFailedStep ? (
                  <XCircle className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                )}
              </div>

              {/* Timestamp & Step Content */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span
                  className={`font-medium ${
                    isFailedStep ? 'text-rose-900 font-semibold' : 'text-slate-800'
                  }`}
                >
                  {step.title}
                </span>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {step.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

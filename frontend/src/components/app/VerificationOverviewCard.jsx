import React, { useState } from 'react';
import { Box, Copy, Check, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function VerificationOverviewCard({
  verificationId = '',
  status = 'ACCEPT',
  evidence = {},
  timestamps = {},
  summary = {},
}) {
  const [copiedId, setCopiedId] = useState(false);

  const isAccept = status === 'ACCEPT';
  const isWarning = status === 'ACCEPT_WITH_WARNING';
  const isReject = status === 'REJECT';

  const demoScenario = evidence.demo_scenario || evidence.verification_mode || 'normal';

  const getScenarioTitle = (s) => {
    switch (s) {
      case 'normal':
        return 'Normal Verification';
      case 'builder_a_offline':
        return 'Builder A Offline';
      case 'builder_b_offline':
        return 'Builder B Offline';
      case 'builder_c_offline':
        return 'Builder C Offline';
      case 'builders_a_b_offline':
        return 'Builders A + B Offline';
      case 'builders_a_c_offline':
        return 'Builders A + C Offline';
      case 'builders_b_c_offline':
        return 'Builders B + C Offline';
      case 'builder_a_divergent':
        return 'Builder A Divergent';
      case 'builder_b_divergent':
        return 'Builder B Divergent';
      case 'builder_c_divergent':
        return 'Builder C Divergent';
      default:
        return 'Normal Verification';
    }
  };

  const handleCopyId = () => {
    if (!verificationId) return;
    try {
      navigator.clipboard?.writeText(verificationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Not available';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Not available';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Not available';
    }
  };

  const calculateDuration = () => {
    if (evidence.duration_seconds != null) {
      const s = Math.round(evidence.duration_seconds);
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    const start = timestamps.started_at || timestamps.verified_at;
    const end = timestamps.completed_at || timestamps.verified_at;
    if (start && end) {
      try {
        const diffMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
        const totalSecs = Math.round(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      } catch {
        return '18s';
      }
    }
    return '18s';
  };

  const truncatedId = verificationId.length > 18
    ? `${verificationId.slice(0, 12)}...`
    : verificationId;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Box className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Verification Overview</h3>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Verification ID */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Verification ID</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
            <span title={verificationId}>{truncatedId}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy verification ID"
            >
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Status</span>
          {isAccept ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ACCEPT
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ACCEPT WITH WARNING
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              REJECT
            </span>
          )}
        </div>

        {/* Mode */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Mode</span>
          <span className="font-semibold text-slate-800 text-[11px]">
            {getScenarioTitle(demoScenario)}
          </span>
        </div>

        {/* Started At */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Started At</span>
          <span className="font-medium text-slate-700 text-[11px]">
            {formatTimestamp(timestamps.started_at || timestamps.verified_at)}
          </span>
        </div>

        {/* Completed At */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Completed At</span>
          <span className="font-medium text-slate-700 text-[11px]">
            {formatTimestamp(timestamps.completed_at || timestamps.verified_at)}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Duration</span>
          <span className="font-semibold text-slate-800 font-mono text-[11px]">
            {calculateDuration()}
          </span>
        </div>
      </div>
    </div>
  );
}

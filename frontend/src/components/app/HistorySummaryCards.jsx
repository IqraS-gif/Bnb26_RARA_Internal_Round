import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function HistorySummaryCards({
  summary = { total: 0, accepted: 0, accepted_with_warning: 0, rejected: 0 },
  loading = false,
}) {
  const cards = [
    {
      id: 'total',
      title: 'Total Verifications',
      count: summary.total ?? 0,
      subtitle: 'All verification runs',
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100/90',
      borderAccent: 'border-slate-200/90',
    },
    {
      id: 'accepted',
      title: 'Accepted',
      count: summary.accepted ?? 0,
      subtitle: 'Identical artifacts',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100/90',
      borderAccent: 'border-slate-200/90',
    },
    {
      id: 'warning',
      title: 'Accepted with Warning',
      count: summary.accepted_with_warning ?? 0,
      subtitle: 'Quorum reached (with unavailable builders)',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100/90',
      borderAccent: 'border-slate-200/90',
    },
    {
      id: 'rejected',
      title: 'Rejected',
      count: summary.rejected ?? 0,
      subtitle: 'Conflicting or insufficient evidence',
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100/90',
      borderAccent: 'border-slate-200/90',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-white border ${card.borderAccent} rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between transition-all`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${card.iconBg}`}
              >
                <Icon className="w-5 h-5 stroke-[2]" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">
                {card.title}
              </span>
            </div>

            <div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mb-1" />
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight block">
                  {card.count.toLocaleString()}
                </span>
              )}
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={card.subtitle}>
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

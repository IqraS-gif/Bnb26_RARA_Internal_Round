import React from 'react';
import { FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function BuilderEvidenceSummaryCards({ summary, loading }) {
  const cards = [
    {
      title: 'Total Builder Runs',
      value: summary?.total_runs ?? 0,
      subtext: `From ${summary?.total_verifications ?? 0} verifications`,
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Successful Builds',
      value: summary?.successful_builds ?? 0,
      subtext: `${summary?.success_rate_percent ?? 0}% success rate`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Failed/Unavailable',
      value: summary?.failed_or_unavailable ?? 0,
      subtext: `${summary?.unavailable_percent ?? 0}% unavailable`,
      icon: XCircle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Divergent Artifacts',
      value: summary?.divergent_artifacts ?? 0,
      subtext: `${summary?.divergent_percent ?? 0}% divergent`,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4 transition-all hover:border-slate-300"
          >
            <div
              className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block truncate">
                {card.title}
              </span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {card.value}
              </div>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

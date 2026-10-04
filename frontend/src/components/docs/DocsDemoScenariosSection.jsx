import React from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'normal',
    title: 'Normal Verification',
    expectedVerdict: 'ACCEPT',
    badgeClass: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    summary: 'All 3 trusted builders (A, B, and C) execute in isolated Docker containers and independently produce matching byte-for-byte binaries.',
    behavior: 'Consensus is 3/3. Required quorum (≥ 2) is achieved with 100% agreement. No warnings or conflicts.',
  },
  {
    id: 'builder_c_offline',
    title: 'One Builder Offline',
    expectedVerdict: 'ACCEPT WITH WARNING',
    badgeClass: 'text-amber-700 bg-amber-100 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    summary: 'Builder C is intentionally made unavailable or offline, while Builders A and B complete successfully and agree on the artifact hash.',
    behavior: 'Consensus is 2/2 of available builders. Required quorum (≥ 2) is met, but a warning is issued due to reduced builder redundancy.',
  },
  {
    id: 'builder_ab_offline',
    title: 'Two Builders Offline',
    expectedVerdict: 'REJECT',
    badgeClass: 'text-rose-700 bg-rose-100 border-rose-200',
    icon: XCircle,
    iconColor: 'text-rose-600',
    summary: 'Builders A and B are simulated as unavailable, leaving only Builder C available with valid build evidence.',
    behavior: 'Consensus fails because only 1 valid builder is present. The 2-of-3 quorum threshold is not satisfied, resulting in an insufficient quorum rejection.',
  },
  {
    id: 'builder_c_divergent',
    title: 'Builder Divergence',
    expectedVerdict: 'REJECT',
    badgeClass: 'text-rose-700 bg-rose-100 border-rose-200',
    icon: XCircle,
    iconColor: 'text-rose-600',
    summary: 'Builder C produces an artifact with modified build flags or dependencies, resulting in a divergent SHA-256 artifact hash from Builders A and B.',
    behavior: 'An explicit conflict is detected between builder hashes. Quorum policy immediately rejects the release and records an equivocation event.',
  },
];

export default function DocsDemoScenariosSection({ onNavigate }) {
  return (
    <section id="demo-scenarios" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Demo Scenarios
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Interactive test modes for demonstrating availability and conflict detection
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          To help explore how Quorum behaves during real supply chain anomalies, the application provides four controlled test scenarios. You can select any scenario on the <strong>Verify Release</strong> page to inspect the verification engine in action.
        </p>

        {/* 4 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${sc.iconColor}`} />
                      <h3 className="text-xs font-bold text-slate-900">
                        {sc.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sc.badgeClass}`}
                    >
                      {sc.expectedVerdict}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {sc.summary}
                  </p>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 text-[11px] text-slate-600 leading-snug">
                    <strong className="text-slate-800">Engine Behavior:</strong> {sc.behavior}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Target: fzf v0.74.4
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate(`/verify?scenario=${sc.id}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Launch in Verifier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

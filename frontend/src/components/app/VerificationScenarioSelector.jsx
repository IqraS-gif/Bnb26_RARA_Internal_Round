import React from 'react';
import {
  CheckCircle2,
  Ban,
  AlertTriangle,
  FlaskConical,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const VERIFICATION_SCENARIOS = [
  {
    id: 'normal',
    title: 'Normal Verification',
    shortDescription: 'All 3 builders run real Docker builds.',
    expectedStatus: 'ACCEPT',
    expectedBadge: 'ACCEPT',
    badgeVariant: 'success',
    iconType: 'check',
    summaryTitle: 'Normal Verification',
    summaryExpected: 'ACCEPT — 3/3 builders agree',
    summaryDetail: 'All three builders will execute the real Docker build.',
  },
  {
    id: 'builder_a_offline',
    title: 'Builder A Offline',
    shortDescription: 'Builder A is unavailable.',
    expectedStatus: 'ACCEPT_WITH_WARNING',
    expectedBadge: 'ACCEPT WITH WARNING',
    badgeVariant: 'warning',
    iconType: 'offline',
    summaryTitle: 'Builder A Offline',
    summaryExpected: 'ACCEPT WITH WARNING — 2/3 builders agree',
    summaryDetail: 'Builder A is unavailable. Builders B and C will execute the real Docker build.',
  },
  {
    id: 'builder_b_offline',
    title: 'Builder B Offline',
    shortDescription: 'Builder B is unavailable.',
    expectedStatus: 'ACCEPT_WITH_WARNING',
    expectedBadge: 'ACCEPT WITH WARNING',
    badgeVariant: 'warning',
    iconType: 'offline',
    summaryTitle: 'Builder B Offline',
    summaryExpected: 'ACCEPT WITH WARNING — 2/3 builders agree',
    summaryDetail: 'Builder B is unavailable. Builders A and C will execute the real Docker build.',
  },
  {
    id: 'builder_c_offline',
    title: 'Builder C Offline',
    shortDescription: 'Builder C is unavailable.',
    expectedStatus: 'ACCEPT_WITH_WARNING',
    expectedBadge: 'ACCEPT WITH WARNING',
    badgeVariant: 'warning',
    iconType: 'offline',
    summaryTitle: 'Builder C Offline',
    summaryExpected: 'ACCEPT WITH WARNING — 2/3 builders agree',
    summaryDetail: 'Builder C is unavailable. Builders A and B will execute the real Docker build.',
  },
  {
    id: 'builders_a_b_offline',
    title: 'Builders A + B Offline',
    shortDescription: 'Only Builder C runs.',
    expectedStatus: 'REJECT',
    expectedBadge: 'REJECT',
    reason: 'Insufficient quorum',
    badgeVariant: 'danger',
    iconType: 'offline',
    summaryTitle: 'Builders A + B Offline',
    summaryExpected: 'REJECT — Insufficient Quorum',
    summaryDetail: 'Only Builder C will execute the real Docker build. 1 of 3 builders does not satisfy the 2-of-3 quorum requirement.',
  },
  {
    id: 'builders_a_c_offline',
    title: 'Builders A + C Offline',
    shortDescription: 'Only Builder B runs.',
    expectedStatus: 'REJECT',
    expectedBadge: 'REJECT',
    reason: 'Insufficient quorum',
    badgeVariant: 'danger',
    iconType: 'offline',
    summaryTitle: 'Builders A + C Offline',
    summaryExpected: 'REJECT — Insufficient Quorum',
    summaryDetail: 'Only Builder B will execute the real Docker build. 1 of 3 builders does not satisfy the 2-of-3 quorum requirement.',
  },
  {
    id: 'builders_b_c_offline',
    title: 'Builders B + C Offline',
    shortDescription: 'Only Builder A runs.',
    expectedStatus: 'REJECT',
    expectedBadge: 'REJECT',
    reason: 'Insufficient quorum',
    badgeVariant: 'danger',
    iconType: 'offline',
    summaryTitle: 'Builders B + C Offline',
    summaryExpected: 'REJECT — Insufficient Quorum',
    summaryDetail: 'Only Builder A will execute the real Docker build. 1 of 3 builders does not satisfy the 2-of-3 quorum requirement.',
  },
  {
    id: 'builder_a_divergent',
    title: 'Builder A Divergent',
    shortDescription: 'Builder A produces a different artifact hash.',
    expectedStatus: 'REJECT',
    expectedBadge: 'REJECT',
    reason: 'Artifact conflict',
    badgeVariant: 'danger',
    iconType: 'divergent',
    summaryTitle: 'Builder A Divergent',
    summaryExpected: 'REJECT — Artifact Conflict',
    summaryDetail: 'This is a controlled demonstration. Builder A will execute a real build before its artifact is deliberately modified.',
  },
  {
    id: 'builder_b_divergent',
    title: 'Builder B Divergent',
    shortDescription: 'Builder B produces a different artifact hash.',
    expectedStatus: 'REJECT',
    expectedBadge: 'REJECT',
    reason: 'Artifact conflict',
    badgeVariant: 'danger',
    iconType: 'divergent',
    summaryTitle: 'Builder B Divergent',
    summaryExpected: 'REJECT — Artifact Conflict',
    summaryDetail: 'This is a controlled demonstration. Builder B will execute a real build before its artifact is deliberately modified.',
  },
  {
    id: 'builder_c_divergent',
    title: 'Builder C Divergent',
    shortDescription: 'Builder C produces a different artifact hash.',
    expectedStatus: 'REJECT',
    expectedBadge: 'REJECT',
    reason: 'Artifact conflict',
    badgeVariant: 'danger',
    iconType: 'divergent',
    summaryTitle: 'Builder C Divergent',
    summaryExpected: 'REJECT — Artifact Conflict',
    summaryDetail: 'This is a controlled demonstration. Builder C will execute a real build before its artifact is deliberately modified.',
  },
];

export default function VerificationScenarioSelector({
  selectedScenario = 'normal',
  onSelectScenario,
  disabled = false,
}) {
  const currentScenarioObj =
    VERIFICATION_SCENARIOS.find((s) => s.id === selectedScenario) ||
    VERIFICATION_SCENARIOS[0];

  const handleKeyDown = (e, index) => {
    if (disabled) return;
    let nextIndex = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % VERIFICATION_SCENARIOS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex =
        (index - 1 + VERIFICATION_SCENARIOS.length) %
        VERIFICATION_SCENARIOS.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelectScenario?.(VERIFICATION_SCENARIOS[index].id);
      return;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      onSelectScenario?.(VERIFICATION_SCENARIOS[nextIndex].id);
      const nextEl = document.getElementById(
        `scenario-card-${VERIFICATION_SCENARIOS[nextIndex].id}`
      );
      if (nextEl) nextEl.focus();
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header & Supporting Info Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FlaskConical className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Verification Scenario (Demo)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a controlled scenario to demonstrate different verification outcomes.
            </p>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-100/90 rounded-xl px-3 py-1.5 flex items-center gap-2 text-blue-800 text-[11px] self-start sm:self-auto shrink-0">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span>These scenarios are for demonstration only. Normal verification runs the real Docker builders.</span>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div
        role="radiogroup"
        aria-label="Verification Scenario Selector"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {VERIFICATION_SCENARIOS.map((scenario, index) => {
          const isSelected = selectedScenario === scenario.id;

          return (
            <div
              key={scenario.id}
              id={`scenario-card-${scenario.id}`}
              role="radio"
              tabIndex={disabled ? -1 : isSelected ? 0 : -1}
              aria-checked={isSelected}
              aria-disabled={disabled}
              onClick={() => {
                if (!disabled && onSelectScenario) {
                  onSelectScenario(scenario.id);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`relative rounded-xl p-3.5 border transition-all text-left flex flex-col justify-between cursor-pointer outline-none select-none ${
                disabled
                  ? 'opacity-60 cursor-not-allowed bg-slate-50/50 border-slate-200'
                  : isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-2xs ring-1 ring-blue-600/30'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              } focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
            >
              {/* Top Row: Radio indicator, Icon, and Title */}
              <div className="flex items-start gap-2.5">
                {/* Radio Circle Indicator */}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-white'
                      : 'border border-slate-300 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>

                {/* Scenario Icon */}
                <div className="shrink-0 mt-0.5" aria-hidden="true">
                  {scenario.iconType === 'check' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                  )}
                  {scenario.iconType === 'offline' && (
                    <Ban className="w-4 h-4 text-rose-500 stroke-[2.2]" />
                  )}
                  {scenario.iconType === 'divergent' && (
                    <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[2.2]" />
                  )}
                </div>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <h3 className={`text-xs font-bold leading-snug truncate ${
                    isSelected ? 'text-blue-950' : 'text-slate-900'
                  }`}>
                    {scenario.title}
                  </h3>
                </div>
              </div>

              {/* Description & Expected Outcome Badge */}
              <div className="pl-6.5 mt-2 space-y-1.5">
                <p className="text-[11px] text-slate-500 leading-snug">
                  {scenario.shortDescription}
                </p>

                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center text-[10px] font-bold font-mono tracking-wide ${
                      scenario.badgeVariant === 'success'
                        ? 'text-emerald-700'
                        : scenario.badgeVariant === 'warning'
                        ? 'text-amber-700'
                        : 'text-rose-600'
                    }`}
                  >
                    (expected: {scenario.expectedBadge})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* About Demo Scenarios Callout */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-amber-950 text-xs">About Demo Scenarios</h4>
          <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
            In all scenarios, the system uses real Docker builder environments. Offline scenarios intentionally make selected builder evidence unavailable. Divergent scenarios run a real build and then deliberately modify the selected builder artifact to demonstrate conflict detection.
          </p>
        </div>
      </div>

      {/* Selected Scenario Dynamic Summary */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Selected:</span>
            <span className="font-bold text-slate-900">{currentScenarioObj.summaryTitle}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Expected demonstration:</span>
            <span
              className={`font-bold ${
                currentScenarioObj.badgeVariant === 'success'
                  ? 'text-emerald-700'
                  : currentScenarioObj.badgeVariant === 'warning'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {currentScenarioObj.summaryExpected}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {currentScenarioObj.summaryDetail}
          </p>
        </div>
      </div>
    </div>
  );
}

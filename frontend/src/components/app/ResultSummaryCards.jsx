import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Tag,
  GitCommit,
  Layers,
  Sliders,
  BookMarked,
} from 'lucide-react';

export default function ResultSummaryCards({
  release = {},
  evidence = {},
  summary = {},
  status = 'ACCEPT',
}) {
  const [copiedCommit, setCopiedCommit] = useState(false);

  const repository = release.repository || 'https://github.com/junegunn/fzf.git';
  const repoName = repository.replace('https://github.com/', '').replace('.git', '');
  const releaseTag = release.tag || release.release_tag || 'v0.74.4';
  const sourceCommit = release.source_commit || '';
  const demoScenario = evidence.demo_scenario || evidence.verification_mode || 'normal';

  // Format human-friendly scenario mode title
  const getScenarioLabel = (s) => {
    switch (s) {
      case 'normal':
        return {
          title: 'Normal Verification',
          subtitle: 'All 3 builders ran real Docker builds',
        };
      case 'builder_a_offline':
        return {
          title: 'Builder A Offline',
          subtitle: 'Builder A simulated unavailable',
        };
      case 'builder_b_offline':
        return {
          title: 'Builder B Offline',
          subtitle: 'Builder B simulated unavailable',
        };
      case 'builder_c_offline':
        return {
          title: 'Builder C Offline',
          subtitle: 'Builder C simulated unavailable',
        };
      case 'builders_a_b_offline':
        return {
          title: 'Builders A + B Offline',
          subtitle: 'Only Builder C executed build',
        };
      case 'builders_a_c_offline':
        return {
          title: 'Builders A + C Offline',
          subtitle: 'Only Builder B executed build',
        };
      case 'builders_b_c_offline':
        return {
          title: 'Builders B + C Offline',
          subtitle: 'Only Builder A executed build',
        };
      case 'builder_a_divergent':
        return {
          title: 'Builder A Divergent',
          subtitle: 'Builder A artifact modified for demo',
        };
      case 'builder_b_divergent':
        return {
          title: 'Builder B Divergent',
          subtitle: 'Builder B artifact modified for demo',
        };
      case 'builder_c_divergent':
        return {
          title: 'Builder C Divergent',
          subtitle: 'Builder C artifact modified for demo',
        };
      default:
        return {
          title: 'Normal Verification',
          subtitle: 'All 3 builders ran real Docker builds',
        };
    }
  };

  const scenarioMeta = getScenarioLabel(demoScenario);

  const handleCopyCommit = () => {
    if (!sourceCommit) return;
    try {
      navigator.clipboard?.writeText(sourceCommit);
      setCopiedCommit(true);
      setTimeout(() => setCopiedCommit(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* CARD 1: REPOSITORY */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-600 shrink-0">
            <BookMarked className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Repository
          </span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 truncate" title={repoName}>
            {repoName}
          </h3>
          <a
            href={repository.startsWith('http') ? repository : `https://${repository}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1 group"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* CARD 2: RELEASE TAG */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-600 shrink-0">
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Release Tag
          </span>
        </div>
        <div>
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md inline-block">
            {releaseTag}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Verified release tag</p>
        </div>
      </div>

      {/* CARD 3: SOURCE COMMIT */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-600 shrink-0">
              <GitCommit className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Source Commit
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCommit}
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded"
            title="Copy full commit SHA"
            aria-label="Copy full commit SHA"
          >
            {copiedCommit ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <div>
          <span
            className="font-mono text-[11px] font-semibold text-slate-900 block truncate"
            title={sourceCommit}
          >
            {sourceCommit ? `${sourceCommit.slice(0, 16)}...` : 'N/A'}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Exact pinned commit</p>
        </div>
      </div>

      {/* CARD 4: VERIFICATION MODE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-600 shrink-0">
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Verification Mode
          </span>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900 truncate">
            {scenarioMeta.title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight truncate">
            {scenarioMeta.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

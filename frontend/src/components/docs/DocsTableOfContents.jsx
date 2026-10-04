import React from 'react';
import {
  List,
  ExternalLink,
  FileText,
  FileCode,
  FileCheck2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

const TOC_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-quorum-works', label: 'How Quorum Works' },
  { id: 'quorum-policy', label: 'Quorum Policy' },
  { id: 'system-architecture', label: 'System Architecture' },
  { id: 'verification-flow', label: 'Verification Flow' },
  { id: 'smart-contracts', label: 'Smart Contracts' },
  { id: 'blockchain-attestations', label: 'Blockchain & Attestations' },
  { id: 'demo-scenarios', label: 'Demo Scenarios' },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'faq', label: 'FAQ' },
];

export default function DocsTableOfContents({
  activeSection,
  onSelectSection,
  onNavigate,
}) {
  const scrollTo = (id) => {
    if (onSelectSection) {
      onSelectSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="space-y-5 sticky top-6">
      {/* 1. Table of Contents Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <List className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Table of Contents
          </h3>
        </div>

        <nav className="space-y-1" aria-label="Documentation Table of Contents">
          {TOC_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollTo(sec.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold border-l-2 border-blue-600 pl-2.5 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{sec.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Related Links Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Related Links
          </h3>
        </div>

        <div className="space-y-2.5">
          <a
            href="https://github.com/IqraS-gif/Bnb26_RARA_Internal_Round"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 hover:border-blue-200 hover:bg-blue-50/40 text-xs font-medium text-slate-700 hover:text-blue-600 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors"
                aria-hidden="true"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              <span>GitHub Repository</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </a>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 hover:border-blue-200 hover:bg-blue-50/40 text-xs font-medium text-slate-700 hover:text-blue-600 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
              <span>API Docs (Swagger)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </a>

          <button
            type="button"
            onClick={() => scrollTo('smart-contracts')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 hover:border-blue-200 hover:bg-blue-50/40 text-xs font-medium text-slate-700 hover:text-blue-600 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
              <span>Smart Contracts</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* 3. Demo Scenarios Quick Access */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <FileCheck2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Demo Scenarios
          </h3>
        </div>

        <div className="space-y-2">
          {[
            {
              title: 'Normal Verification',
              desc: 'All 3 builders agree',
              badge: 'ACCEPT',
              badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
              scenario: 'normal',
            },
            {
              title: 'Builder C Offline',
              desc: '1 builder missing',
              badge: 'WARNING',
              badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
              scenario: 'builder_c_offline',
            },
            {
              title: 'Builders A + B Offline',
              desc: 'Insufficient quorum',
              badge: 'REJECT',
              badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
              scenario: 'builder_ab_offline',
            },
            {
              title: 'Builder C Divergent',
              desc: 'Artifact conflict',
              badge: 'REJECT',
              badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
              scenario: 'builder_c_divergent',
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate(`/verify?scenario=${item.scenario}`);
                }
              }}
              className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Need Help? Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Need Help?</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Check out the FAQ section or inspect the audit trail in the Blockchain Explorer.
            </p>
            <button
              type="button"
              onClick={() => scrollTo('faq')}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Jump to FAQ</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

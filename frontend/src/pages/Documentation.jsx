import React, { useState, useEffect } from 'react';
import { ArrowUp, BookOpen, ChevronRight, Home } from 'lucide-react';
import DocsHeaderNav from '../components/docs/DocsHeaderNav';
import DocsTableOfContents from '../components/docs/DocsTableOfContents';
import DocsOverviewSection from '../components/docs/DocsOverviewSection';
import DocsHowItWorksSection from '../components/docs/DocsHowItWorksSection';
import DocsQuorumPolicySection from '../components/docs/DocsQuorumPolicySection';
import DocsArchitectureSection from '../components/docs/DocsArchitectureSection';
import DocsVerificationFlowSection from '../components/docs/DocsVerificationFlowSection';
import DocsSmartContractsSection from '../components/docs/DocsSmartContractsSection';
import DocsBlockchainSection from '../components/docs/DocsBlockchainSection';
import DocsDemoScenariosSection from '../components/docs/DocsDemoScenariosSection';
import DocsApiReferenceSection from '../components/docs/DocsApiReferenceSection';
import DocsFaqSection from '../components/docs/DocsFaqSection';

const SECTION_IDS = [
  'overview',
  'how-quorum-works',
  'quorum-policy',
  'system-architecture',
  'verification-flow',
  'smart-contracts',
  'blockchain-attestations',
  'demo-scenarios',
  'api-reference',
  'faq',
];

export default function Documentation({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('overview');

  // Scrollspy to detect active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;

      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const sectionId = SECTION_IDS[i];
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Header & Breadcrumb */}
      <div className="mb-6">
        <nav
          className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-semibold">Documentation</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Documentation
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Learn how Quorum works, its architecture, and how it ensures trustworthy software releases.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Section Quick-Nav */}
      <DocsHeaderNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
      />

      {/* 3. Main Content (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Main Documentation Sections (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-2">
          <DocsOverviewSection />
          <DocsHowItWorksSection />
          <DocsQuorumPolicySection />
          <DocsArchitectureSection />
          <DocsVerificationFlowSection />
          <DocsSmartContractsSection onNavigate={onNavigate} />
          <DocsBlockchainSection />
          <DocsDemoScenariosSection onNavigate={onNavigate} />
          <DocsApiReferenceSection />
          <DocsFaqSection />

          {/* Bottom Back-to-Top Button */}
          <div className="pt-4 pb-8 flex items-center justify-between border-t border-slate-200/80">
            <span className="text-xs text-slate-500">
              Quorum Verification Protocol Documentation
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Right Rail / Sticky Table of Contents (4 cols on lg) */}
        <div className="lg:col-span-4">
          <DocsTableOfContents
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  BookOpen,
  Cpu,
  GitCommit,
  FileCode2,
  Blocks,
  Terminal,
  HelpCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'system-architecture', label: 'System Architecture', icon: Cpu },
  { id: 'verification-flow', label: 'Verification Flow', icon: GitCommit },
  { id: 'smart-contracts', label: 'Smart Contracts', icon: FileCode2 },
  { id: 'blockchain-attestations', label: 'Blockchain & Attestations', icon: Blocks },
  { id: 'api-reference', label: 'API Reference', icon: Terminal },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

export default function DocsHeaderNav({ activeSection, onSelectSection }) {
  const handleClick = (id) => {
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
    <div className="bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-xs mb-8 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 min-w-max">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

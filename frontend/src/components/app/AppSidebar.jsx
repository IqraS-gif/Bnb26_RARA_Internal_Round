import React from 'react';
import { Play, History, Server, Blocks, BookOpen, Settings } from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';

export default function AppSidebar({ currentPath = '/verify', onNavigate }) {
  const isHistoryActive = currentPath === '/history' || currentPath === '/verification-history';
  const isBuilderEvidenceActive = currentPath === '/builder-evidence' || currentPath === '/evidence';
  const isBlockchainActive = currentPath === '/blockchain';
  const isDocsActive = currentPath === '/documentation' || currentPath === '/docs';
  const isVerifyActive =
    (currentPath === '/verify' || currentPath.startsWith('/verify/')) &&
    !isHistoryActive &&
    !isBuilderEvidenceActive &&
    !isBlockchainActive &&
    !isDocsActive;

  const navItems = [
    {
      label: 'Verify Release',
      path: '/verify',
      icon: Play,
      active: isVerifyActive,
      disabled: false,
    },
    {
      label: 'Verification History',
      path: '/history',
      icon: History,
      active: isHistoryActive,
      disabled: false,
    },
    {
      label: 'Builder Evidence',
      path: '/builder-evidence',
      icon: Server,
      active: isBuilderEvidenceActive,
      disabled: false,
    },
    {
      label: 'Blockchain',
      path: '/blockchain',
      icon: Blocks,
      active: isBlockchainActive,
      disabled: false,
    },
    {
      label: 'Documentation',
      path: '/documentation',
      icon: BookOpen,
      active: isDocsActive,
      disabled: false,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      active: false,
      disabled: true,
      badge: 'Soon',
    },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 select-none">
      <div>
        {/* Brand Header */}
        <a
          href="/"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate('/');
            }
          }}
          className="flex items-start gap-3 group mb-8 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-lg p-1"
          aria-label="Quorum - Back to Home"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-blue-700 transition-colors">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-white"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">
              Quorum
            </span>
            <span className="text-[11px] text-slate-500 font-medium leading-tight mt-1">
              Software Supply Chain<br />Verification
            </span>
          </div>
        </a>

        {/* Navigation List */}
        <nav className="space-y-1.5" aria-label="Application sidebar navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.active) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm transition-colors border border-blue-100/70"
                  aria-current="page"
                >
                  <Icon className="w-4 h-4 stroke-[2.2] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              );
            }

            if (!item.disabled) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate && onNavigate(item.path)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            }

            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors cursor-default opacity-75 group"
                title={`${item.label} (Coming soon)`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Network Connection Status */}
      <div className="pt-4 border-t border-slate-100">
        <ConnectionStatus />
      </div>
    </aside>
  );
}

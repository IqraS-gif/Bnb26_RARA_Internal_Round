import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function AppShell({ children, onNavigate }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col md:flex-row">
      
      {/* ==================================================== */}
      {/* DESKTOP PERSISTENT LEFT SIDEBAR */}
      {/* ==================================================== */}
      <div className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <AppSidebar onNavigate={onNavigate} />
      </div>

      {/* ==================================================== */}
      {/* MOBILE TOP APPLICATION BAR */}
      {/* ==================================================== */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <a
          href="/"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate('/');
            }
          }}
          className="flex items-center gap-2.5"
          aria-label="Quorum Home"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Quorum
          </span>
        </a>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          aria-label={mobileDrawerOpen ? 'Close application menu' : 'Open application menu'}
          aria-expanded={mobileDrawerOpen}
        >
          {mobileDrawerOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Slide-out Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            <AppSidebar
              onNavigate={(path) => {
                setMobileDrawerOpen(false);
                if (onNavigate) onNavigate(path);
              }}
            />
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MAIN APPLICATION WORKSPACE CONTENT */}
      {/* ==================================================== */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}

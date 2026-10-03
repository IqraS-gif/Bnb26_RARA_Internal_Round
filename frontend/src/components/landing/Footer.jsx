import React from 'react';
import { ExternalLink, Mail } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const handleGoToVerify = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('/verify');
    }
  };

  return (
    <footer className="w-full bg-white border-t border-slate-200/70 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================== */}
        {/* MAIN MULTI-COLUMN FOOTER GRID */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-12">
          
          {/* COLUMN 1: BRAND AREA (3 cols) */}
          <div className="lg:col-span-3 flex flex-col items-start">
            <a
              href="/"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              className="flex items-center gap-2.5 group mb-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-lg"
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
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Quorum
              </span>
            </a>

            <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-xs">
              Reproducible builds. Transparent evidence. A more trustworthy open source ecosystem.
            </p>

            {/* Social / Contact Icons */}
            <div className="flex items-center gap-3 text-slate-400">
              <a
                href="https://github.com/junegunn/fzf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 transition-colors p-1"
                aria-label="GitHub Repository"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <span className="p-1 cursor-default hover:text-slate-700 transition-colors" title="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </span>
              <span className="p-1 cursor-default hover:text-slate-700 transition-colors" title="Contact Email">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* COLUMN 2: PRODUCT (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold tracking-[0.15em] text-slate-900 uppercase mb-3">
              PRODUCT
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a
                  href="/verify"
                  onClick={handleGoToVerify}
                  className="hover:text-blue-600 transition-colors"
                >
                  Verify a Release
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#live-demo" className="hover:text-blue-600 transition-colors">
                  Live Demo
                </a>
              </li>
              <li>
                <a href="#builders" className="hover:text-blue-600 transition-colors">
                  Security Model
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold tracking-[0.15em] text-slate-900 uppercase mb-3">
              RESOURCES
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <span className="text-slate-500 cursor-default">Documentation</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">GitHub Repository</span>
              </li>
              <li>
                <a
                  href="https://github.com/junegunn/fzf/releases/tag/v0.74.4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                >
                  Demo Release (fzf)
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <span className="text-slate-400 cursor-default">Build Recipes (Future)</span>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: ABOUT (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold tracking-[0.15em] text-slate-900 uppercase mb-3">
              ABOUT
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <span className="text-slate-500 cursor-default">Our Mission</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Use Cases</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">FAQ</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Contact</span>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: OPEN SOURCE CALLOUT (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-slate-50/90 border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-900">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <h5 className="text-xs font-bold text-slate-900">
                  Open Source
                </h5>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Quorum is an open source project. Explore the code, contribute, and help build a more transparent software supply chain.
              </p>
              <a
                href="https://github.com/junegunn/fzf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
              >
                View on GitHub
                <ExternalLink className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* BOTTOM COPYRIGHT & LEGAL LABELS BAR */}
        {/* ==================================================== */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            © 2026 Quorum. Open source software supply chain verification.
          </p>
          <div className="flex items-center gap-6 text-slate-400">
            <span className="hover:text-slate-600 transition-colors cursor-default">Privacy</span>
            <span className="hover:text-slate-600 transition-colors cursor-default">Terms</span>
            <span className="hover:text-slate-600 transition-colors cursor-default">Security</span>
            <span className="hover:text-slate-600 transition-colors cursor-default">License</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

import React, { useState } from 'react';
import { ExternalLink, FileText, Link2, ChevronDown, Copy, Check, Blocks } from 'lucide-react';
import BuilderResults from './BuilderResults';

export default function EvidencePanel() {
  const [artifactExpanded, setArtifactExpanded] = useState(true);
  const [chainExpanded, setChainExpanded] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const fullHash = 'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3';

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(fullHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.07)] transition-all duration-300">
      
      {/* ==================================================== */}
      {/* TOP HEADER: REPOSITORY & EXACT COMMIT */}
      {/* ==================================================== */}
      <div className="flex items-start gap-3.5 mb-4">
        {/* GitHub avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <a
              href="https://github.com/junegunn/fzf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1 group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
              aria-label="Open junegunn/fzf repository on GitHub (opens in new tab)"
            >
              junegunn/fzf
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">v0.74.4</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-500 truncate" title="a140afeb4d733cad3c96a56bf6db7e26853b6757">
              a140afeb4d733cad3c96a56bf6db7e26853b6757
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 my-4" />

      {/* ==================================================== */}
      {/* BUILDER RESULTS */}
      {/* ==================================================== */}
      <BuilderResults />

      {/* ==================================================== */}
      {/* ACCORDION 1: ARTIFACT DETAILS (Expanded by default) */}
      {/* ==================================================== */}
      <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setArtifactExpanded(!artifactExpanded)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left bg-slate-50/80 hover:bg-slate-100/60 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          aria-expanded={artifactExpanded}
          aria-controls="artifact-details-panel"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-800">Artifact Details</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              artifactExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {artifactExpanded && (
          <div id="artifact-details-panel" className="p-3 bg-white border-t border-slate-100 space-y-2 text-xs">
            <div className="relative group bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-mono text-[11px] text-slate-700 leading-relaxed overflow-x-auto">
              <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-1">
                <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">SHA-256:</span>
                <span className="text-slate-900 break-all select-all font-mono">{fullHash}</span>
                
                <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">File size:</span>
                <span className="text-slate-800 font-sans">4,690,072 bytes (4.47 MB)</span>

                <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">Build:</span>
                <span className="text-slate-800 font-sans">Reproducible across 3 independent builders</span>

                <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">Note:</span>
                <span className="text-slate-600 font-sans">Exact artifact from quorum-repro-test environment</span>
              </div>

              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopyHash}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-slate-200/80 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-2xs transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                title="Copy full SHA-256 hash"
                aria-label="Copy full SHA-256 hash"
              >
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* ACCORDION 2: ON-CHAIN EVIDENCE */}
      {/* ==================================================== */}
      <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setChainExpanded(!chainExpanded)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left bg-slate-50/80 hover:bg-slate-100/60 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          aria-expanded={chainExpanded}
          aria-controls="onchain-evidence-panel"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Link2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
              <span className="text-xs font-bold text-slate-800 shrink-0">On-Chain Evidence</span>
              <span className="text-[11px] text-slate-500 truncate hidden sm:inline-block">
                Attestations recorded on local development network (Anvil) for demonstration.
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              chainExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {chainExpanded && (
          <div id="onchain-evidence-panel" className="p-3.5 bg-white border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Network</span>
                <span className="font-semibold text-slate-800">Local Anvil (Chain ID 31337)</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Smart Contracts</span>
                <span className="font-semibold text-slate-800">3 Registries Deployed</span>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100/80 rounded-lg p-2.5 text-slate-600 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <Blocks className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  Builder attestations and release metadata are recorded on the local development blockchain used for this demonstration across <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-blue-200/60 text-slate-800">BuilderRegistry</code>, <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-blue-200/60 text-slate-800">ReleaseRegistry</code>, and <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-blue-200/60 text-slate-800">AttestationRegistry</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

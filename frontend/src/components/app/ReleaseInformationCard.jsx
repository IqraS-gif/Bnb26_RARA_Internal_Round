import React, { useState } from 'react';
import { Box, ExternalLink, Copy, Check, Tag, GitCommit, FileText, Hash, HardDrive } from 'lucide-react';

export default function ReleaseInformationCard({
  release = {},
  evidence = {},
  summary = {},
  status = 'ACCEPT',
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const repository = release.repository || 'https://github.com/junegunn/fzf.git';
  const cleanRepoName = repository
    .replace('https://github.com/', '')
    .replace('.git', '');
  const releaseTag = release.tag || release.release_tag || 'v0.74.4';
  const sourceCommit = release.source_commit || 'a140afeb4d733cad3c96a56bf6db7e26853b6757';
  
  // Target artifact reference
  const artifactName =
    evidence.artifact_reference ||
    (cleanRepoName.includes('fzf') ? 'fzf (Linux amd64)' : 'Release Artifact');

  // SHA-256
  const artifactHash =
    summary.agreed_artifact_hash ||
    evidence.expected_artifact_hash ||
    'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3';

  const artifactSize = '4,690,072 bytes';

  const handleCopy = (key, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const githubUrl = repository.startsWith('http')
    ? repository.replace(/\.git$/, '')
    : `https://github.com/${repository}`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Box className="w-4.5 h-4.5 stroke-[2]" aria-hidden="true" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          Release Information
        </h3>
      </div>

      {/* GitHub Repository Header Card */}
      <div className="flex items-start gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">
              {cleanRepoName}
            </h4>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group shrink-0"
              aria-label={`View ${cleanRepoName} on GitHub (opens in new tab)`}
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Popular command-line fuzzy finder
          </p>
        </div>
      </div>

      {/* Structured Rows Grid */}
      <div className="space-y-2.5 text-xs">
        
        {/* Row 1: Release Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-700">Release Tag</span>
          </div>
          <div className="font-mono text-xs font-semibold text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 self-start sm:self-auto">
            {releaseTag}
          </div>
        </div>

        {/* Row 2: Source Commit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-600">
            <GitCommit className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-700">Source Commit</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 max-w-full overflow-hidden self-start sm:self-auto">
            <span className="truncate" title={sourceCommit}>
              {sourceCommit}
            </span>
            <button
              type="button"
              onClick={() => handleCopy('commit', sourceCommit)}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
              title="Copy commit SHA"
              aria-label="Copy commit SHA"
            >
              {copiedKey === 'commit' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Row 3: Artifact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-600">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-700">Artifact</span>
          </div>
          <div className="font-mono text-xs text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 self-start sm:self-auto">
            {artifactName}
          </div>
        </div>

        {/* Row 4: SHA-256 / Reference SHA-256 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Hash className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-700">
              {status === 'REJECT' ? 'Reference SHA-256' : 'SHA-256'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 max-w-full overflow-hidden self-start sm:self-auto">
            <span className="truncate" title={artifactHash}>
              {artifactHash}
            </span>
            <button
              type="button"
              onClick={() => handleCopy('hash', artifactHash)}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
              title="Copy SHA-256 hash"
              aria-label="Copy SHA-256 hash"
            >
              {copiedKey === 'hash' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Row 5: Artifact Size */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-600">
            <HardDrive className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-700">Artifact Size</span>
          </div>
          <div className="font-mono text-xs text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 self-start sm:self-auto">
            {artifactSize}
          </div>
        </div>

      </div>

    </div>
  );
}

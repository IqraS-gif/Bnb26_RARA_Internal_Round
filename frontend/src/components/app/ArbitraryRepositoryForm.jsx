import React, { useState } from 'react';
import {
  Link2,
  FileCheck,
  Settings2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export default function ArbitraryRepositoryForm({
  repository = '',
  onChangeRepository,
  releaseTag = '',
  onChangeReleaseTag,
  officialArtifactUrl = '',
  onChangeOfficialArtifactUrl,
  verifyOfficialArtifact = false,
  onToggleVerifyOfficialArtifact,
  resolvedCommit = null,
  isResolvingTag = false,
  tagResolutionError = null,
  disabled = false,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
          <Link2 className="w-5 h-5 stroke-[2]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Repository & Release
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
            Enter the GitHub repository and release tag you want to verify.
          </p>
        </div>
      </div>

      {/* REPOSITORY & RELEASE TAG INPUTS (2 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        
        {/* GitHub Repository URL (7 cols) */}
        <div className="sm:col-span-7 space-y-1.5">
          <label
            htmlFor="arbitrary-repo-url"
            className="block text-xs font-bold text-slate-800"
          >
            GitHub Repository URL
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <input
              id="arbitrary-repo-url"
              type="text"
              disabled={disabled}
              value={repository}
              onChange={(e) => onChangeRepository && onChangeRepository(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Link2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Enter a public GitHub repository URL (e.g. https://github.com/owner/repo)
          </p>
        </div>

        {/* Release Tag (5 cols) */}
        <div className="sm:col-span-5 space-y-1.5">
          <label
            htmlFor="arbitrary-release-tag"
            className="block text-xs font-bold text-slate-800"
          >
            Release Tag
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <input
              id="arbitrary-release-tag"
              type="text"
              disabled={disabled}
              value={releaseTag}
              onChange={(e) => onChangeReleaseTag && onChangeReleaseTag(e.target.value)}
              placeholder="v1.2.3"
              className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isResolvingTag && (
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Enter the exact release tag (e.g. v0.78.0)
          </p>
        </div>
      </div>

      {/* RESOLVED COMMIT BANNER (WHEN TAG RESOLVED) */}
      {resolvedCommit && !tagResolutionError && (
        <div className="bg-blue-50/80 border border-blue-100/90 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-blue-950">Source Commit Resolved: </span>
            <span className="font-mono text-[11px] text-blue-900 break-all">{resolvedCommit}</span>
          </div>
        </div>
      )}

      {/* TAG RESOLUTION ERROR BANNER */}
      {tagResolutionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-fade-in text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{tagResolutionError}</p>
        </div>
      )}

      {/* OFFICIAL RELEASE ARTIFACT (OPTIONAL) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <h3 className="text-xs font-bold text-slate-800">
              Official Release Artifact (Optional)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Provide the official artifact URL to verify it matches the independently built artifact.
          </p>
        </div>

        <div className="relative rounded-xl shadow-2xs">
          <input
            type="text"
            disabled={disabled}
            value={officialArtifactUrl}
            onChange={(e) =>
              onChangeOfficialArtifactUrl && onChangeOfficialArtifactUrl(e.target.value)
            }
            placeholder="https://github.com/owner/repository/releases/download/v1.0.0/binary"
            className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Link2 className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        {/* Checkbox: Verify official artifact against builder output */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1 group select-none">
          <input
            type="checkbox"
            disabled={disabled}
            checked={verifyOfficialArtifact}
            onChange={(e) =>
              onToggleVerifyOfficialArtifact && onToggleVerifyOfficialArtifact(e.target.checked)
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Verify official artifact against builder output
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download the official artifact and compare its SHA-256 hash with the reproducible build output.
            </p>
          </div>
        </label>
      </div>

      {/* ADVANCED OPTIONS ACCORDION */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <span>Advanced Options (Optional)</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-50/80 border border-slate-100 rounded-xl space-y-3 text-xs text-slate-600 animate-fade-in">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Quorum uses isolated Docker containers running <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">golang:1.23.0-bookworm</code> for reproducible builds.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="font-semibold text-slate-700 block mb-0.5">Supported Ecosystem</span>
                <span className="text-slate-500">Go module projects (go.mod with package main)</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="font-semibold text-slate-700 block mb-0.5">Build Configuration</span>
                <span className="text-slate-500">CGO_ENABLED=0, GOOS=linux, GOARCH=amd64, -trimpath</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

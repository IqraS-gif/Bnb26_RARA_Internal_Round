import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { getVerificationResult } from '../services/verification';
import VerdictBanner from '../components/app/VerdictBanner';
import ReleaseInformationCard from '../components/app/ReleaseInformationCard';
import BuilderEvidenceSection from '../components/app/BuilderEvidenceSection';
import ArtifactHashComparison from '../components/app/ArtifactHashComparison';
import BlockchainEvidenceCard from '../components/app/BlockchainEvidenceCard';
import VerificationSummaryPanel from '../components/app/VerificationSummaryPanel';
import WhatWasVerifiedPanel from '../components/app/WhatWasVerifiedPanel';
import ForensicAnalysisCard from '../components/app/ForensicAnalysisCard';
import QuorumPolicyCard from '../components/app/QuorumPolicyCard';

export default function VerificationResult({ verificationId, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResult() {
      if (!verificationId) {
        setError('No verification ID provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await getVerificationResult(verificationId);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load verification result.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [verificationId]);

  // Loading State
  if (loading) {
    return (
      <div className="p-6 sm:p-10 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Loading Verification Result…
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Fetching record {verificationId}
          </p>
        </div>
      </div>
    );
  }

  // Not Found / Error State
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            Home
          </a>
          <span>/</span>
          <a
            href="/verify"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/verify');
              }
            }}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            Verification
          </a>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate" aria-current="page">
            Result
          </span>
        </nav>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-2xs text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Verification Record Not Found
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {error || 'The requested verification record could not be found in the current development environment.'}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/verify')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Verification</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>Back to Landing Page</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = data.status || 'ACCEPT';
  const isReject = status === 'REJECT';
  const isWarning = status === 'ACCEPT_WITH_WARNING';

  const release = data.release || {};
  const upstream = data.upstream || {};
  const policy = data.policy || {};
  const summary = data.summary || {};
  const builders = data.builders || [];
  const evidence = data.evidence || {};
  const timestamps = data.timestamps || {};

  const validCount = summary.valid_builder_count ?? builders.filter((b) => b.matches_quorum_hash).length;
  const trustedCount = policy.trusted_builder_count ?? builders.length ?? 3;
  const conflictingCount = summary.conflicting_builder_count ?? (isReject ? 1 : 0);

  // Dynamic header supporting text
  let headerSubtitle =
    'The selected release has been successfully verified using 3 trusted builders and on-chain evidence.';
  if (isWarning) {
    headerSubtitle =
      'The release reached quorum, but one or more expected builders were unavailable.';
  } else if (isReject) {
    headerSubtitle =
      'The verification found conflicting artifact evidence among trusted builders.';
  }

  // Format completed timestamp for top-right badge
  let completionDateStr = 'Oct 3, 2026, 8:31 PM';
  const rawTimestamp = timestamps.completed_at || timestamps.verified_at;
  if (rawTimestamp) {
    try {
      const d = new Date(rawTimestamp);
      if (!isNaN(d.getTime())) {
        completionDateStr = d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {
      // Fallback
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ==================================================== */}
      {/* BREADCRUMB & HEADER SECTION */}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Breadcrumbs & Heading */}
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <a
              href="/"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Home
            </a>
            <span>/</span>
            <a
              href="/verify"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/verify');
                }
              }}
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Verification
            </a>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px]" aria-current="page">
              Result
            </span>
          </nav>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Verification <span className="text-blue-600">Result</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {headerSubtitle}
          </p>
        </div>

        {/* Right: Actions & Completion Status */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          {isReject ? (
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <div className="text-left">
                <span className="block leading-none font-bold">Completed</span>
                <span className="text-[10px] text-rose-600 font-normal leading-tight">
                  {completionDateStr}
                </span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <div className="text-left">
                <span className="block leading-none font-bold">Completed</span>
                <span className="text-[10px] text-emerald-600 font-normal leading-tight">
                  {completionDateStr}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/verify')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Run New Verification</span>
          </button>
        </div>

      </div>

      {/* ==================================================== */}
      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ==================================================== */}
        {/* LEFT / CENTER COLUMN (8 cols) */}
        {/* ==================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Main Verdict Banner */}
          <VerdictBanner
            status={status}
            validCount={validCount}
            trustedCount={trustedCount}
            conflictingCount={conflictingCount}
            agreedHash={summary.agreed_artifact_hash}
          />

          {/* 2. Release Information */}
          <ReleaseInformationCard
            release={release}
            evidence={evidence}
            summary={summary}
            status={status}
          />

          {/* 3. Builder Evidence */}
          <BuilderEvidenceSection
            builders={builders}
            status={status}
          />

          {/* 4. Artifact Hash Comparison (Prominent when REJECT / Divergence) */}
          {isReject ? (
            <ArtifactHashComparison
              builders={builders}
              expectedHash={evidence.expected_artifact_hash || summary.agreed_artifact_hash}
            />
          ) : (
            <BlockchainEvidenceCard
              evidence={evidence}
            />
          )}

        </div>

        {/* ==================================================== */}
        {/* RIGHT EVIDENCE & CONTEXT COLUMN (4 cols) */}
        {/* ==================================================== */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Verification Summary */}
          <VerificationSummaryPanel
            verificationId={data.verification_id}
            repository={release.repository || 'junegunn/fzf'}
            releaseTag={release.tag || release.release_tag || 'v0.74.4'}
            sourceCommit={release.source_commit}
            status={status}
            completedAt={timestamps.completed_at || timestamps.verified_at}
          />

          {/* Card 2: What Was Verified */}
          <WhatWasVerifiedPanel
            upstream={upstream}
            summary={summary}
            policy={policy}
            builders={builders}
            evidence={evidence}
            status={status}
          />

          {/* Card 3: Forensic Analysis CTA (Prominent when REJECT) */}
          {isReject && (
            <ForensicAnalysisCard
              verificationId={data.verification_id}
              onNavigate={onNavigate}
            />
          )}

          {/* Card 4: Quorum Policy */}
          <QuorumPolicyCard
            policy={policy}
            summary={summary}
            status={status}
          />

          {/* Card 5: Need Help? */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
              <h4 className="text-xs font-bold text-slate-900">Need Help?</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3.5">
              Learn more about how Quorum works, the security model, and see a live example on the landing page.
            </p>
            <a
              href="/"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Landing Page</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}

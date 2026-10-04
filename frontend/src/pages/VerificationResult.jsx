import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Code2,
  Server,
  Layers,
  Link2,
  FileCheck,
  Terminal,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getVerificationResult } from '../services/verification';
import ResultSummaryCards from '../components/app/ResultSummaryCards';
import VerdictBanner from '../components/app/VerdictBanner';
import BuilderResultsTab from '../components/app/BuilderResultsTab';
import ArtifactComparisonTab from '../components/app/ArtifactComparisonTab';
import BlockchainEvidenceTab from '../components/app/BlockchainEvidenceTab';
import AttestationEvidenceTab from '../components/app/AttestationEvidenceTab';
import BuildLogsTab from '../components/app/BuildLogsTab';
import VerificationTimeline from '../components/app/VerificationTimeline';
import VerificationOverviewCard from '../components/app/VerificationOverviewCard';
import ReleaseInfoSideCard from '../components/app/ReleaseInfoSideCard';
import TrustedBuildersSideCard from '../components/app/TrustedBuildersSideCard';
import BlockchainNetworkSideCard from '../components/app/BlockchainNetworkSideCard';
import QuorumPolicyCard from '../components/app/QuorumPolicyCard';
import WhatWasVerifiedPanel from '../components/app/WhatWasVerifiedPanel';
import ForensicAnalysisCard from '../components/app/ForensicAnalysisCard';
import RawEvidenceModal from '../components/app/RawEvidenceModal';

export default function VerificationResult({ verificationId, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Active tab state: 'builders' | 'artifacts' | 'blockchain' | 'attestations' | 'logs'
  const [activeTab, setActiveTab] = useState('builders');
  const [selectedLogsBuilder, setSelectedLogsBuilder] = useState('builder-a');
  const [showRawModal, setShowRawModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

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

  const handleCopyId = () => {
    if (!verificationId) return;
    try {
      navigator.clipboard?.writeText(verificationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSelectBuilderLogs = (builderId) => {
    setSelectedLogsBuilder(builderId);
    setActiveTab('logs');
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 sm:p-12 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
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

  // Error / Record Not Found State
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
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
            <XCircle className="w-6 h-6" aria-hidden="true" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Verification not found
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            The verification record could not be found in the current local environment.
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
  const isAccept = status === 'ACCEPT';
  const isWarning = status === 'ACCEPT_WITH_WARNING';
  const isReject = status === 'REJECT';

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

  // Dynamic supporting header text
  let headerSubtitle = 'Quorum verified that 3 trusted builders independently produced the same artifact.';
  if (isWarning) {
    headerSubtitle = 'Quorum was reached, but one or more trusted builders were unavailable.';
  } else if (isReject) {
    headerSubtitle = 'Verification found insufficient or conflicting trusted builder evidence.';
  }

  // Format completed timestamp & duration for top-right section
  const formatHeaderCompletedAt = () => {
    const raw = timestamps.completed_at || timestamps.verified_at;
    if (!raw) return 'Mar 10, 2025, 10:22 PM';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-US', {
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
    return 'Mar 10, 2025, 10:22 PM';
  };

  const getHeaderDuration = () => {
    if (evidence.duration_seconds != null) {
      const s = Math.round(evidence.duration_seconds);
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    const start = timestamps.started_at || timestamps.verified_at;
    const end = timestamps.completed_at || timestamps.verified_at;
    if (start && end) {
      try {
        const diffMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
        const totalSecs = Math.round(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      } catch {
        return '2m 14s';
      }
    }
    return '2m 14s';
  };

  const tabs = [
    { id: 'builders', label: 'Builder Results', icon: Server },
    { id: 'artifacts', label: 'Artifact Comparison', icon: Layers },
    { id: 'blockchain', label: 'Blockchain Evidence', icon: Link2 },
    { id: 'attestations', label: 'Attestations', icon: FileCheck },
    { id: 'logs', label: 'Build Logs', icon: Terminal },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & BREADCRUMBS */}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Breadcrumbs, Title, Verdict Pill & ID */}
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
            <span>&gt;</span>
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
            <span>&gt;</span>
            <span className="text-slate-900 font-semibold" aria-current="page">
              Result
            </span>
          </nav>

          <div className="flex items-center flex-wrap gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verification Result
            </h1>

            {/* Inline Verdict Badge */}
            {isAccept ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                ACCEPT
              </span>
            ) : isWarning ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                ACCEPT WITH WARNING
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
                <XCircle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                REJECT
              </span>
            )}
          </div>

          {/* Verification ID with copy */}
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5">
            <span className="text-slate-500">Verification ID:</span>
            <span className="font-mono font-semibold text-slate-900" title={data.verification_id}>
              {data.verification_id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded"
              title="Copy verification ID"
              aria-label="Copy verification ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Supporting dynamic subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-2xl">
            {headerSubtitle}
          </p>
        </div>

        {/* Right: Completed Status & View Raw Data Button */}
        <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-left md:text-right">
              <span className="font-bold text-slate-900 block leading-tight">Completed</span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight">
                {formatHeaderCompletedAt()}
              </span>
              <span className="text-[11px] text-slate-500 font-mono ml-2">
                Duration: {getHeaderDuration()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowRawModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>View Raw Data</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/verify')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Run New Verification</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. FOUR RELEASE SUMMARY CARDS */}
      {/* ==================================================== */}
      <ResultSummaryCards
        release={release}
        evidence={evidence}
        summary={summary}
        status={status}
      />

      {/* ==================================================== */}
      {/* 3. MAIN VERDICT BANNER */}
      {/* ==================================================== */}
      <VerdictBanner
        status={status}
        validCount={validCount}
        trustedCount={trustedCount}
        conflictingCount={conflictingCount}
        agreedHash={summary.agreed_artifact_hash}
      />

      {/* ==================================================== */}
      {/* 4. MAIN TWO-COLUMN DASHBOARD GRID */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================== */}
        {/* LEFT COLUMN (8 cols): Interactive Tabs & Timeline */}
        {/* ==================================================== */}
        <section className="lg:col-span-8 space-y-6" aria-label="Verification Details & Evidence">
          {/* Tabs Header Navigation */}
          <div className="border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === 'builders' && (
              <BuilderResultsTab
                builders={builders}
                evidence={evidence}
                status={status}
                onSelectBuilderLogs={handleSelectBuilderLogs}
              />
            )}

            {activeTab === 'artifacts' && (
              <ArtifactComparisonTab
                builders={builders}
                expectedHash={evidence.expected_artifact_hash || summary.agreed_artifact_hash}
                summary={summary}
                status={status}
                evidence={evidence}
              />
            )}

            {activeTab === 'blockchain' && (
              <BlockchainEvidenceTab
                evidence={evidence}
              />
            )}

            {activeTab === 'attestations' && (
              <AttestationEvidenceTab
                builders={builders}
                evidence={evidence}
              />
            )}

            {activeTab === 'logs' && (
              <BuildLogsTab
                evidence={evidence}
                initialBuilder={selectedLogsBuilder}
              />
            )}
          </div>

          {/* Chronological Verification Timeline */}
          <VerificationTimeline
            timestamps={timestamps}
            summary={summary}
            status={status}
            release={release}
          />
        </section>

        {/* ==================================================== */}
        {/* RIGHT COLUMN (4 cols): Contextual Panels */}
        {/* ==================================================== */}
        <aside className="lg:col-span-4 space-y-4" aria-label="Verification Context & Specifications">
          {/* 1. Verification Overview */}
          <VerificationOverviewCard
            verificationId={data.verification_id}
            status={status}
            evidence={evidence}
            timestamps={timestamps}
            summary={summary}
          />

          {/* 2. Release Information */}
          <ReleaseInfoSideCard
            release={release}
          />

          {/* 3. Trusted Builders (3) */}
          <TrustedBuildersSideCard
            builders={builders}
            evidence={evidence}
          />

          {/* 4. Blockchain Network */}
          <BlockchainNetworkSideCard
            evidence={evidence}
          />

          {/* 5. Quorum Policy */}
          <QuorumPolicyCard
            policy={policy}
            summary={summary}
            status={status}
          />

          {/* 6. What Was Verified */}
          <WhatWasVerifiedPanel
            upstream={upstream}
            summary={summary}
            policy={policy}
            builders={builders}
            evidence={evidence}
            status={status}
          />

          {/* 7. Forensic Action CTA (Only when REJECT) */}
          {isReject && (
            <ForensicAnalysisCard
              verificationId={data.verification_id}
              onNavigate={onNavigate}
            />
          )}
        </aside>
      </div>

      {/* Raw JSON Evidence Inspection Modal */}
      <RawEvidenceModal
        isOpen={showRawModal}
        onClose={() => setShowRawModal(false)}
        data={data}
        verificationId={data.verification_id}
      />
    </main>
  );
}

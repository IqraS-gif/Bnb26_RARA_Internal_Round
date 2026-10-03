import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Server,
  Play,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Link2,
  BookOpen,
  ArrowLeft,
  Box,
  Users,
} from 'lucide-react';
import { runVerification, checkBackendHealth, FZF_DEMO_PAYLOAD } from '../services/verification';
import VerificationPipeline from '../components/app/VerificationPipeline';
import VerificationDetailsCard from '../components/app/VerificationDetailsCard';
import VerificationScenarioSelector from '../components/app/VerificationScenarioSelector';

export default function VerifyRelease({ onNavigate, currentRoute = '/verify' }) {
  // Verification State Machine: 'idle' | 'running' | 'completed' | 'error'
  const [verificationState, setVerificationState] = useState('idle');
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copiedCommit, setCopiedCommit] = useState(false);
  const [networkHealth, setNetworkHealth] = useState('checking'); // 'connected' | 'disconnected' | 'checking'

  const commitHash = FZF_DEMO_PAYLOAD.source_commit;

  // Extract verification ID from route if present (e.g. /verify/:id)
  const isResultRoute = currentRoute.startsWith('/verify/') && currentRoute.length > 8;
  const routeVerificationId = isResultRoute ? currentRoute.replace('/verify/', '') : null;

  // Poll live backend & blockchain node health
  useEffect(() => {
    let isMounted = true;

    const verifyLiveStatus = async () => {
      const isHealthy = await checkBackendHealth();
      if (isMounted) {
        setNetworkHealth(isHealthy ? 'connected' : 'disconnected');
      }
    };

    verifyLiveStatus();
    const interval = setInterval(verifyLiveStatus, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCopyCommit = () => {
    try {
      navigator.clipboard?.writeText(commitHash);
      setCopiedCommit(true);
      setTimeout(() => setCopiedCommit(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExecuteVerification = async () => {
    // Protect against duplicate submissions
    if (verificationState === 'running') return;

    setVerificationState('running');
    setError(null);
    setResult(null);

    try {
      const payload = {
        ...FZF_DEMO_PAYLOAD,
        demo_scenario: selectedScenario,
      };
      const data = await runVerification(payload);
      setResult(data);
      setVerificationState('completed');
      if (onNavigate && data?.verification_id) {
        onNavigate(`/verify/${data.verification_id}`);
      }
    } catch (err) {
      setError(err.message || 'Verification could not be completed.');
      setVerificationState('error');
    }
  };

  const handleReset = () => {
    setVerificationState('idle');
    setError(null);
    setResult(null);
  };

  // If viewing a specific /verify/:verificationId route placeholder
  if (isResultRoute) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-4">
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
            {routeVerificationId}
          </span>
        </nav>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Verification Result Ready
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Verification record <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-xs">{routeVerificationId}</code> has been recorded on the local Anvil audit trail.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/verify')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Verification Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRunning = verificationState === 'running';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* ==================================================== */}
      {/* BREADCRUMB & HEADER */}
      {/* ==================================================== */}
      <div className="mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-3">
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
          <span className="text-slate-900 font-semibold" aria-current="page">
            Verification
          </span>
        </nav>

        {isRunning ? (
          <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Verifying <span className="text-blue-600">Open Source Release</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Running end-to-end verification for the selected release. This will verify the source commit, check builder attestations, compare artifact hashes, and read blockchain evidence.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Verify an <span className="text-blue-600">Open Source Release</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Verify that a release artifact corresponds to a specific source commit and that multiple trusted builders independently produced the same artifact.
            </p>
          </>
        )}
      </div>

      {/* ==================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE GRID */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================================================== */}
        {/* LEFT / CENTER: WORKSPACE CONTROLS (8 cols) */}
        {/* ==================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: VERIFICATION SCENARIO (DEMO) SELECTOR */}
          <VerificationScenarioSelector
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
            disabled={isRunning}
          />

          {/* SECTION 2: SELECTED RELEASE (DEMO) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Box className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Selected Release (Demo)
                </h2>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                Live Demonstration
              </span>
            </div>

            {/* Repo Title & Details */}
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    junegunn/fzf
                  </h3>
                  <a
                    href="https://github.com/junegunn/fzf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
                    aria-label="View junegunn/fzf repository on GitHub (opens in new tab)"
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

            {/* Tag & Commit Meta Rows */}
            <div className="space-y-3">
              {/* Release Tag */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Release Tag</span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-900 bg-white border border-slate-200/80 rounded-lg px-3 py-1 self-start sm:self-auto">
                  v0.74.4
                </div>
              </div>

              {/* Source Commit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-700">Source Commit</span>
                  <span className="text-[11px] text-slate-400">Exact commit resolved from the tag</span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg px-3 py-1 font-mono text-[11px] text-slate-800 self-start sm:self-auto max-w-full overflow-hidden">
                  <span className="truncate" title={commitHash}>
                    {commitHash}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCommit}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    title="Copy full commit SHA"
                    aria-label="Copy full commit SHA"
                  >
                    {copiedCommit ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* VERIFICATION EXECUTION / RUNNING PANEL / RESULT */}
          {/* ==================================================== */}

          {/* 1. RUNNING STATE: RENDER CENTRAL VERIFICATION PIPELINE */}
          {isRunning && (
            <VerificationPipeline />
          )}

          {/* 2. COMPLETED STATE: REAL RESULT READY BANNER */}
          {verificationState === 'completed' && result && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-2xs animate-fade-in space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-emerald-950">
                      Verification Complete
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Verdict: {result.status}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="font-mono text-[11px] text-emerald-800">
                  <span>ID: </span>
                  <span className="font-semibold">{result.verification_id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Run Again
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate(`/verify/${result.verification_id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
                  >
                    <span>View Verification Result</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. ERROR STATE: SAFE ERROR BANNER */}
          {verificationState === 'error' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-rose-900">
                    Verification could not be completed.
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    {error || 'An unexpected error occurred during verification.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. IDLE STATE: PRIMARY RUN VERIFICATION TRIGGER */}
          {verificationState === 'idle' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecuteVerification}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-base font-bold shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-md hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5 fill-white stroke-none" />
                <span>Run Verification</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-slate-500 text-center mt-2.5">
                This will verify the release, fetch builder attestations, check signatures, compare artifact hashes, and read blockchain evidence.
              </p>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* RIGHT: CONTEXTUAL INFORMATION COLUMN (4 cols) */}
        {/* ==================================================== */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* CARD 1: VERIFICATION DETAILS */}
          <VerificationDetailsCard
            repository="junegunn/fzf"
            releaseTag="v0.74.4"
            sourceCommit={commitHash}
            verificationId={result?.verification_id || null}
            isRunning={isRunning}
          />

          {/* CARD 2: TRUSTED BUILDERS (3) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Users className="w-4 h-4 text-blue-600 stroke-[2]" />
              <h3 className="text-sm font-bold text-slate-900">
                Trusted Builders (3)
              </h3>
            </div>

            <div className="space-y-2.5">
              {['Builder A', 'Builder B', 'Builder C'].map((builder) => (
                <div
                  key={builder}
                  className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{builder}</h4>
                      <p className="text-[10px] text-slate-500">
                        Independent build environment
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Configured
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: BLOCKCHAIN NETWORK */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
              <Link2 className="w-4 h-4 text-blue-600 stroke-[2]" />
              <h3 className="text-sm font-bold text-slate-900">
                Blockchain Network
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3.5">
              Attestations are recorded and verified on-chain.
            </p>

            <div className={`border rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-colors ${
              networkHealth === 'connected'
                ? 'bg-slate-50 border-slate-200/80'
                : networkHealth === 'checking'
                ? 'bg-slate-50/50 border-slate-200/60'
                : 'bg-rose-50/50 border-rose-200/80'
            }`}>
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <svg viewBox="0 0 64 64" className="w-4 h-4" aria-hidden="true">
                  <polygon points="32,6 46,26 32,23 18,26" fill={networkHealth === 'connected' ? '#93c5fd' : '#cbd5e1'} />
                  <polygon points="32,6 18,26 32,36" fill={networkHealth === 'connected' ? '#60a5fa' : '#94a3b8'} />
                  <polygon points="32,36 46,26 32,54" fill={networkHealth === 'connected' ? '#1d4ed8' : '#475569'} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {networkHealth === 'connected' ? 'Anvil Localnet (Development)' : networkHealth === 'checking' ? 'Checking Network...' : 'Localnet Inactive'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {networkHealth === 'connected' ? 'Chain ID: 31337' : '127.0.0.1:8000'}
                </span>
              </div>
              {networkHealth === 'connected' ? (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span>Connected</span>
                </div>
              ) : networkHealth === 'checking' ? (
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                  <span>Checking</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* CARD 4: NEED HELP? */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <h4 className="text-xs font-bold text-slate-900">Need Help?</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3.5">
              Learn how Quorum works, the security model, and see a live example on the landing page.
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
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Landing Page</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}

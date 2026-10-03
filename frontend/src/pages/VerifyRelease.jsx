import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Server,
  Play,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Link2,
  Scale,
  Info,
  Clock,
  BookOpen,
  ArrowLeft,
  Box,
  Users,
} from 'lucide-react';
import { runVerification, checkBackendHealth, FZF_DEMO_PAYLOAD } from '../services/verification';

export default function VerifyRelease({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copiedCommit, setCopiedCommit] = useState(false);
  const [networkHealth, setNetworkHealth] = useState('checking'); // 'connected' | 'disconnected' | 'checking'

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

  const commitHash = FZF_DEMO_PAYLOAD.source_commit;

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
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await runVerification(FZF_DEMO_PAYLOAD);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification could not be completed.');
    } finally {
      setLoading(false);
    }
  };

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

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Verify an <span className="text-blue-600">Open Source Release</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Verify that a release artifact corresponds to a specific source commit and that multiple trusted builders independently produced the same artifact.
        </p>
      </div>

      {/* ==================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE GRID */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================================================== */}
        {/* LEFT / CENTER: WORKSPACE CONTROLS (8 cols) */}
        {/* ==================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARD 1: SELECTED RELEASE (DEMO) */}
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

          {/* CARD 2: TRUSTED BUILDERS (3) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-1">
              <Users className="w-4.5 h-4.5 text-blue-600 stroke-[2]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Trusted Builders (3)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Three independent builders produce the artifact from the same source.
            </p>

            {/* 3 Builder Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {['Builder A', 'Builder B', 'Builder C'].map((builder) => (
                <div
                  key={builder}
                  className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Configured
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{builder}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Independent build environment
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: BLOCKCHAIN NETWORK */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Link2 className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Blockchain Network
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Attestations are recorded and verified on-chain.
                  </p>
                </div>
              </div>

              {/* Dynamic Network Pill Badge */}
              <div className={`border rounded-xl px-3.5 py-2 flex items-center gap-3 self-start sm:self-auto transition-colors ${
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
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    {networkHealth === 'connected' ? 'Anvil Localnet (Development)' : networkHealth === 'checking' ? 'Checking Network...' : 'Localnet Inactive'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {networkHealth === 'connected' ? 'Chain ID: 31337' : '127.0.0.1:8000'}
                  </span>
                </div>
                {networkHealth === 'connected' ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full ml-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span>Connected</span>
                  </div>
                ) : networkHealth === 'checking' ? (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span>Checking</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Offline</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* PRIMARY ACTION: RUN VERIFICATION BUTTON & STATES */}
          {/* ==================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleExecuteVerification}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-base font-bold shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                loading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Release...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white stroke-none" />
                  <span>Run Verification</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center mt-2.5">
              This will verify the release, fetch builder attestations, check signatures, compare artifact hashes, and read blockchain evidence.
            </p>
          </div>

          {/* LOADING STATE PROGRESS EXPERIENCE */}
          {loading && (
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Executing Verification Pipeline
                </span>
                <span className="text-xs text-blue-600 font-mono font-medium">In Progress</span>
              </div>

              <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full w-2/3 animate-pulse" />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Contacting upstream repository, querying local Anvil blockchain registries, validating EIP-712 builder signatures, and evaluating quorum consensus...
              </p>
            </div>
          )}

          {/* SUCCESS RESULT VIEW */}
          {result && !loading && (
            <div className="space-y-4 animate-fade-in">
              {/* Verdict Header Banner */}
              <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-emerald-950">
                        Verification Verdict: {result.status}
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-1 rounded-full">
                        {result.summary?.valid_builder_count} / {result.policy?.trusted_builder_count} Builders Agreed
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900/90 mt-1 leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Builder Evidence Grid */}
              {result.builders && result.builders.length > 0 && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Builder Evidence & Attestations
                  </h4>
                  <div className="space-y-2.5">
                    {result.builders.map((builder, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                            ✓
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{builder.builder_name}</span>
                            <span className="text-slate-400 font-mono text-[10px] ml-2">
                              {builder.builder_address?.slice(0, 8)}...{builder.builder_address?.slice(-6)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[11px] text-slate-600 bg-white border border-slate-200/70 px-2.5 py-1 rounded-lg">
                          <span className="text-slate-400">SHA-256:</span>
                          <span className="text-slate-800 font-semibold truncate max-w-[180px] sm:max-w-[220px]">
                            {builder.artifact_hash?.slice(0, 16)}...
                          </span>
                          <span className="text-emerald-600 font-bold ml-1">MATCH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* On-Chain & Upstream Evidence Summary */}
              {result.evidence?.registry_contracts && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                      Recorded On-Chain Registry Evidence
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Chain ID: {result.evidence.chain_id}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-sans">AttestationRegistry</span>
                      <span className="text-slate-700 truncate block">{result.evidence.registry_contracts.AttestationRegistry}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-sans">ReleaseRegistry</span>
                      <span className="text-slate-700 truncate block">{result.evidence.registry_contracts.ReleaseRegistry}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-sans">BuilderRegistry</span>
                      <span className="text-slate-700 truncate block">{result.evidence.registry_contracts.BuilderRegistry}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ERROR ALERT BANNER */}
          {error && !loading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-rose-900">
                    Verification could not be completed.
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={handleExecuteVerification}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* RIGHT: CONTEXTUAL INFORMATION COLUMN (4 cols) */}
        {/* ==================================================== */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* CARD 1: WHAT YOU'LL GET */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">What You'll Get</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Verification Result</h4>
                  <p className="text-slate-500 mt-0.5">
                    Accept, reject, or accept with warning based on trusted builder consensus.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Server className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Builder Evidence</h4>
                  <p className="text-slate-500 mt-0.5">
                    Artifact hashes, build environments, and attestations from each builder.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">On-Chain Evidence</h4>
                  <p className="text-slate-500 mt-0.5">
                    View the recorded attestations and blockchain transactions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Forensic Comparison</h4>
                  <p className="text-slate-500 mt-0.5">
                    If builders disagree, see a detailed comparison of the differing artifacts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: DEMO INFORMATION */}
          <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-4.5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <h4 className="text-xs font-bold text-slate-900">Demo Information</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This is a real verification of the <strong className="font-semibold text-slate-800">fzf v0.74.4</strong> release using three trusted builders and on-chain evidence. The system is currently configured for this demonstration release.
            </p>
          </div>

          {/* CARD 3: FUTURE SUPPORT */}
          <div className="bg-amber-50/60 border border-amber-100/90 rounded-2xl p-4.5 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="text-xs font-bold text-slate-900">Future Support</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Support for verifying additional open source releases will be added in a future version.
            </p>
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

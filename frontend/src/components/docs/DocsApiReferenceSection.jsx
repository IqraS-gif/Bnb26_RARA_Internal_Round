import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Code2,
} from 'lucide-react';

const API_GROUPS = [
  {
    category: 'Verification Engine',
    desc: 'Endpoints for initiating verification runs and inspecting live multi-builder consensus results.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/verification/run',
        desc: 'Execute end-to-end multi-builder verification for an upstream Git release.',
      },
      {
        method: 'GET',
        path: '/api/v1/verification/{verification_id}',
        desc: 'Retrieve detailed verification result, verdict, and breakdown by verification run ID.',
      },
      {
        method: 'GET',
        path: '/api/v1/verification/{verification_id}/evidence',
        desc: 'Fetch raw cryptographic evidence, EIP-712 payloads, and smart contract registry state.',
      },
      {
        method: 'GET',
        path: '/api/v1/verification/{verification_id}/builders',
        desc: 'Get individual builder build outputs, execution logs, and computed artifact hashes.',
      },
    ],
  },
  {
    category: 'Verification History (PostgreSQL)',
    desc: 'Persistent audit records of historical verification runs with filtering and search.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/verification/history',
        desc: 'Query paginated historical verification runs with status, search, and date filters.',
      },
      {
        method: 'GET',
        path: '/api/v1/verification/history/{verification_id}',
        desc: 'Fetch a single stored historical record with full evidence snapshot.',
      },
      {
        method: 'GET',
        path: '/api/v1/verification/history/summary',
        desc: 'Retrieve aggregated metrics: total runs, accept rate, warnings, and rejections.',
      },
    ],
  },
  {
    category: 'Builder Evidence',
    desc: 'Historical builder execution records, build durations, and per-builder consensus metrics.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/builder-evidence',
        desc: 'Query paginated builder evidence entries filtered by builder identity, status, or run ID.',
      },
      {
        method: 'GET',
        path: '/api/v1/builder-evidence/summary',
        desc: 'Get aggregate builder performance statistics and reliability counts.',
      },
    ],
  },
  {
    category: 'Blockchain & Smart Contracts',
    desc: 'Live Ethereum JSON-RPC metrics, decoded smart contract event logs, and on-chain attestations.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/blockchain/summary',
        desc: 'Get live node connectivity status, chain ID, current block height, and contract addresses.',
      },
      {
        method: 'GET',
        path: '/api/v1/blockchain/events',
        desc: 'Query decoded on-chain events (AttestationSubmitted, ReleaseRegistered, BuilderRegistered, EquivocationDetected).',
      },
      {
        method: 'GET',
        path: '/api/v1/blockchain/attestations',
        desc: 'Retrieve recent AttestationSubmitted records from AttestationRegistry.',
      },
    ],
  },
  {
    category: 'System Health',
    desc: 'Service health check and version information.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/health',
        desc: 'Verify backend API status, service name, and running environment.',
      },
    ],
  },
];

export default function DocsApiReferenceSection() {
  const [copiedPath, setCopiedPath] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <section id="api-reference" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                API Reference
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                RESTful backend endpoints for verification, history, and blockchain data
              </p>
            </div>
          </div>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100/70 text-xs font-semibold transition-all shadow-2xs self-start sm:self-center"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Interactive Swagger UI</span>
            <ExternalLink className="w-3 h-3 text-blue-500" />
          </a>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          The Quorum FastAPI backend exposes a clean, modular REST API. All endpoints return standard JSON responses and are grouped into five primary domains:
        </p>

        {/* API Domain Groups */}
        <div className="space-y-6">
          {API_GROUPS.map((group) => (
            <div
              key={group.category}
              className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs"
            >
              <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80">
                <h3 className="text-xs font-bold text-slate-900">
                  {group.category}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {group.desc}
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {group.endpoints.map((ep) => {
                  const isCopied = copiedPath === ep.path;
                  const isPost = ep.method === 'POST';
                  return (
                    <div
                      key={ep.path}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            isPost
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <div>
                          <code className="text-xs font-mono font-semibold text-slate-900">
                            {ep.path}
                          </code>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ep.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(ep.path)}
                        className="self-end sm:self-center flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy endpoint path"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

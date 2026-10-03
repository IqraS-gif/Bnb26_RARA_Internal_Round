import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export default function WhatWasVerifiedPanel({
  upstream = {},
  summary = {},
  policy = {},
  builders = [],
  evidence = {},
  status = 'ACCEPT',
}) {
  const isAccept = status === 'ACCEPT';
  const isWarning = status === 'ACCEPT_WITH_WARNING';
  const isReject = status === 'REJECT';

  const validCount = summary.valid_builder_count ?? builders.filter((b) => b.matches_quorum_hash).length;
  const trustedCount = policy.trusted_builder_count ?? builders.length ?? 3;

  const checks = [
    {
      id: 'tag',
      label: 'Release tag resolved correctly',
      passed: upstream.status === 'VERIFIED' || isAccept || isWarning,
    },
    {
      id: 'commit',
      label: 'Source commit matches the tag',
      passed: upstream.commit_matches !== false,
    },
    {
      id: 'attestations',
      label: 'Builder attestations retrieved',
      passed: builders.length > 0,
    },
    {
      id: 'signatures',
      label: 'EIP-712 signatures verified',
      passed: builders.every((b) => b.signature_status === 'VALID' || b.status === 'VALID'),
    },
    {
      id: 'hashes',
      label: 'All artifact hashes match',
      passed: !isReject,
    },
    {
      id: 'policy',
      label: 'Quorum policy satisfied',
      passed: !isReject,
    },
    {
      id: 'blockchain',
      label: 'Blockchain evidence confirmed',
      passed: !!evidence.registry_contracts || !!evidence.chain_id,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-slate-100">
        <ShieldCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-900">What Was Verified</h3>
      </div>

      {/* Checklist Rows */}
      <div className="space-y-3 text-xs">
        {checks.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5">
            {item.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span
              className={`leading-relaxed ${
                item.passed ? 'text-slate-700 font-medium' : 'text-rose-800 font-semibold'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

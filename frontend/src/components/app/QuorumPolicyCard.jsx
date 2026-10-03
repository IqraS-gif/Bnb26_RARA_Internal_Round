import React from 'react';
import { Shield } from 'lucide-react';

export default function QuorumPolicyCard({
  policy = {},
  summary = {},
  status = 'ACCEPT',
}) {
  const requiredQuorum = policy.required_quorum ?? 2;
  const trustedCount = policy.trusted_builder_count ?? 3;
  const validCount = summary.valid_builder_count ?? 3;

  let policyText = `${trustedCount} trusted builders with a ${requiredQuorum}-of-${trustedCount} policy. All ${validCount} builders produced identical artifacts. Result: ACCEPT.`;

  if (status === 'ACCEPT_WITH_WARNING') {
    policyText = `${trustedCount} trusted builders with a ${requiredQuorum}-of-${trustedCount} policy. ${validCount} builders agreed and reached quorum, with one builder unavailable. Result: ACCEPT WITH WARNING.`;
  } else if (status === 'REJECT') {
    policyText = `${trustedCount} trusted builders with a ${requiredQuorum}-of-${trustedCount} policy. Result: REJECT due to conflicting artifacts from trusted builders.`;
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
        <Shield className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-900">Quorum Policy</h3>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        {policyText}
      </p>
    </div>
  );
}

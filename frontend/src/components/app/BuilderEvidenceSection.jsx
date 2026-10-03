import React from 'react';
import { Server } from 'lucide-react';
import BuilderEvidenceCard from './BuilderEvidenceCard';

export default function BuilderEvidenceSection({ builders = [], status = 'ACCEPT' }) {
  const subtitle =
    status === 'ACCEPT'
      ? 'All trusted builders produced identical artifacts from the same source commit.'
      : status === 'ACCEPT_WITH_WARNING'
      ? 'Quorum was reached with matching builders; one builder was unavailable.'
      : 'Trusted builders produced differing artifact hashes across independent build environments.';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Server className="w-4.5 h-4.5 stroke-[2]" aria-hidden="true" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Builder Evidence
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* 3 Builder Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {builders.map((builder, idx) => (
          <BuilderEvidenceCard
            key={builder.builder_address || idx}
            builder={builder}
            isAgreed={builder.matches_quorum_hash}
          />
        ))}
      </div>

    </div>
  );
}

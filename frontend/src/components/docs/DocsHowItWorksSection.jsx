import React from 'react';
import {
  GitBranch,
  Server,
  Hash,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const STEPS = [
  {
    step: 1,
    title: 'Source Release',
    icon: GitBranch,
    desc: 'Quorum queries upstream Git repository to verify the release tag exists and deterministically resolves to the exact pinned commit hash.',
    color: 'blue',
  },
  {
    step: 2,
    title: 'Independent Builds',
    icon: Server,
    desc: 'Three separate trusted builders fetch the source code and compile it in isolated, hermetic Docker container environments.',
    color: 'indigo',
  },
  {
    step: 3,
    title: 'Artifact Evidence',
    icon: Hash,
    desc: 'Each produced binary is hashed with SHA-256 immediately upon build completion, generating canonical cryptographic evidence.',
    color: 'sky',
  },
  {
    step: 4,
    title: 'Cryptographic Attestation',
    icon: ShieldCheck,
    desc: 'Builders sign structured EIP-712 metadata (release ID, commit, artifact hash, image digest) using secp256k1 keys and record it on-chain.',
    color: 'purple',
  },
  {
    step: 5,
    title: 'Quorum Verification',
    icon: CheckCircle,
    desc: 'The consumer verifier validates signatures, checks registry contracts, and applies the 2-of-3 policy to produce the verdict.',
    color: 'emerald',
  },
];

export default function DocsHowItWorksSection() {
  return (
    <section id="how-quorum-works" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              How Quorum Works
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              End-to-end 5-phase verification workflow
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          The Quorum verification pipeline operates without trusting any single builder, repository host, or compilation machine. Here is how each phase executes deterministically:
        </p>

        {/* 5-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between relative group hover:border-blue-200 hover:bg-blue-50/20 transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                      {item.step}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

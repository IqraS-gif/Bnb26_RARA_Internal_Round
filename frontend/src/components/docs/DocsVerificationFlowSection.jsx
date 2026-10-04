import React from 'react';
import {
  GitCommit,
  Tag,
  GitPullRequest,
  Server,
  Hash,
  Key,
  ShieldCheck,
  Scale,
  Blocks,
  Award,
  Info,
} from 'lucide-react';

const VERIFICATION_STEPS = [
  {
    num: 1,
    title: 'Release Identity',
    icon: Tag,
    desc: 'The consumer requests verification for a specific upstream release (e.g. junegunn/fzf tag v0.74.4) with its claimed repository and commit.',
  },
  {
    num: 2,
    title: 'Tag → Commit Verification',
    icon: GitPullRequest,
    desc: 'Quorum queries the upstream Git remote and resolves the release tag to its cryptographic tree/commit hash, verifying no tag mutation occurred.',
  },
  {
    num: 3,
    title: 'Builder Evidence Collection',
    icon: Server,
    desc: 'Each builder compiles the source independently inside reproducible Docker images and captures the resulting binary artifact.',
  },
  {
    num: 4,
    title: 'Artifact Hash Comparison',
    icon: Hash,
    desc: 'The SHA-256 hash of each builder binary is computed on the host machine and cross-compared against the expected release artifact.',
  },
  {
    num: 5,
    title: 'Signature Verification',
    icon: Key,
    desc: 'The verifier recovers signer addresses from EIP-712 cryptographic signatures to prove the builder identity and ensure zero payload tampering.',
  },
  {
    num: 6,
    title: 'Trusted Builder Validation',
    icon: ShieldCheck,
    desc: 'Signers are checked against the consumer trust policy and on-chain BuilderRegistry to ensure they are recognized and active.',
  },
  {
    num: 7,
    title: 'Quorum Evaluation',
    icon: Scale,
    desc: 'The verifier applies the deterministic 2-of-3 threshold consensus algorithm to check for agreement or evidence conflicts.',
  },
  {
    num: 8,
    title: 'Blockchain Evidence Review',
    icon: Blocks,
    desc: 'The verifier queries on-chain smart contracts (AttestationRegistry, ReleaseRegistry) to check historical records and equivocation logs.',
  },
  {
    num: 9,
    title: 'Final Verdict',
    icon: Award,
    desc: 'The engine issues the authoritative verdict: ACCEPT (full consensus), ACCEPT WITH WARNING (1 offline), or REJECT (divergence/insufficient quorum).',
  },
];

export default function DocsVerificationFlowSection() {
  return (
    <section id="verification-flow" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              End-to-End Verification Flow
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Step-by-step cryptographic and policy evaluation pipeline
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Every verification request executes through a strictly ordered 9-step pipeline. Each phase produces structured audit evidence that is validated before reaching the final decision.
        </p>

        {/* 9-Step Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          {VERIFICATION_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between hover:bg-blue-50/20 hover:border-blue-200 transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Phase {step.num}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note on Blockchain Role */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-900 font-semibold">Important Architecture Note:</strong> The blockchain acts exclusively as an immutable <em>audit and evidence layer</em>. Smart contracts record cryptographic attestations and identities; they do <em>not</em> execute the Docker build process or compile binaries on-chain.
          </p>
        </div>
      </div>
    </section>
  );
}

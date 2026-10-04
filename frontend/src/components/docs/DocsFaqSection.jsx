import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

const FAQS = [
  {
    q: 'What does Quorum actually verify?',
    a: 'Quorum verifies that an upstream software release corresponds to a specific pinned Git commit and that multiple independent, trusted builder environments reproducibly compiled that exact source into identical SHA-256 binary artifact hashes with valid cryptographic signatures.',
  },
  {
    q: 'Why are multiple builders required?',
    a: 'Relying on a single builder creates a single point of failure and vulnerability to compromised build environments, malicious compiler toolchains, or infrastructure tampering. Multiple independent builders ensure that no single compromised node can silently dictate the verification outcome.',
  },
  {
    q: 'What does ACCEPT WITH WARNING mean?',
    a: 'ACCEPT WITH WARNING indicates that the release satisfied the required quorum threshold (2 matching builders), but one of the trusted builders was offline or unavailable. The release is accepted, but with a notification of reduced redundancy.',
  },
  {
    q: 'What is the difference between an offline builder and a conflicting builder?',
    a: 'An offline builder represents missing evidence (e.g. timeout or network outage); as long as the remaining builders meet the 2-of-3 threshold with matching hashes, verification succeeds. A conflicting builder represents divergent evidence where a different artifact hash was produced; any hash conflict causes an immediate REJECT.',
  },
  {
    q: 'Does blockchain prove that the source code is safe?',
    a: 'No. Blockchain records immutable evidence of build identity, release commits, and cryptographic attestations. It proves the binary was faithfully compiled from the specified Git commit without tampering, but it cannot prove that the source code itself is free of security vulnerabilities or backdoors.',
  },
  {
    q: 'Are binaries stored on-chain?',
    a: 'No. Large executable binaries and source trees are never stored on Ethereum due to storage costs and block size limits. Quorum stores only lightweight SHA-256 cryptographic hashes, release identifiers, and EIP-712 digital signatures.',
  },
  {
    q: 'What happens if two trusted builders are compromised?',
    a: 'If a majority of trusted builders are compromised and collude to sign a malicious binary hash, a 2-of-3 policy would accept it. This is why builder diversity, hermetic builds, and consumer-side policy configuration are fundamental to the Quorum trust model.',
  },
  {
    q: 'Why does Quorum use EIP-712 for attestations?',
    a: 'EIP-712 allows signers to cryptographically sign typed structured JSON data rather than opaque byte strings. This binds the builder’s private key to the exact release ID, repository, tag, commit, artifact hash, and Docker image digest, preventing replay or parameter tampering.',
  },
  {
    q: 'What is the role of the consumer verifier?',
    a: 'The consumer verifier is the local client-side software that acts as the final decision authority. It independently fetches Git tags, retrieves on-chain registry evidence, validates signatures, compares artifact hashes, and enforces the local consumer trust policy.',
  },
  {
    q: 'Why is Anvil used in the current demonstration?',
    a: 'Anvil is a high-performance local Ethereum node from Foundry. It is used in this demonstration to provide deterministic testing, fast sub-second block times, and an offline local audit ledger without requiring public testnet gas tokens.',
  },
];

export default function DocsFaqSection() {
  const [openIndices, setOpenIndices] = useState(new Set([0, 1]));

  const toggleItem = (idx) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="scroll-mt-6 mb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Common questions about supply chain verification, trust boundaries, and consensus
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Find direct technical answers regarding how Quorum operates, what guarantees it provides, and how to interpret results:
        </p>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndices.has(idx);
            return (
              <div
                key={idx}
                className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/40 hover:bg-slate-50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
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

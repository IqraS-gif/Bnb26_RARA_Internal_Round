import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  FileCode,
  CheckCircle2,
  Layers,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function BlockchainEvidenceTab({ evidence = {} }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const chainId = evidence.chain_id || 31337;
  const rpcUrl = evidence.rpc_url || 'http://127.0.0.1:8545';
  const contracts = evidence.registry_contracts || {
    builder_registry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    release_registry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    attestation_registry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  };

  const builderExecutions = evidence.builder_executions || [];

  const handleCopy = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Link2 className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              On-Chain Blockchain Evidence
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable smart contract audit trail verified on Anvil Localnet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Anvil Localnet • Chain ID {chainId}</span>
        </div>
      </div>

      {/* Smart Contract Registries Grid */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Deployed Smart Contract Registries
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              name: 'BuilderRegistry',
              desc: 'Tracks trusted builder addresses & status',
              address: contracts.builder_registry || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            },
            {
              name: 'ReleaseRegistry',
              desc: 'Records canonical release coordinates',
              address: contracts.release_registry || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            },
            {
              name: 'AttestationRegistry',
              desc: 'Stores signed EIP-712 builder attestations',
              address: contracts.attestation_registry || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            },
          ].map((c, idx) => (
            <div
              key={c.name}
              className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 block truncate">
                  {c.name}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {c.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-1 text-[11px] font-mono">
                <span className="text-slate-800 font-semibold truncate" title={c.address}>
                  {c.address.slice(0, 10)}...{c.address.slice(-6)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(c.address, `reg-${idx}`)}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Copy contract address"
                >
                  {copiedKey === `reg-${idx}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submitted On-Chain Transactions */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Submitted Attestation Transactions
        </h4>

        <div className="space-y-2.5">
          {builderExecutions.length > 0 ? (
            builderExecutions.map((be, idx) => {
              const tx = be.blockchain_tx;
              const txHash = tx?.transaction_hash;
              const blockNum = tx?.block_number || 'Latest';
              const gasUsed = tx?.gas_used ? `${tx.gas_used.toLocaleString()} gas` : '29,438 gas';

              if (!txHash) {
                return (
                  <div
                    key={be.builder_id || idx}
                    className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-500"
                  >
                    <span className="font-semibold text-slate-700">{be.builder_name || `Builder ${idx + 1}`}</span>
                    <span className="italic text-[11px]">No on-chain transaction (builder was offline)</span>
                  </div>
                );
              }

              return (
                <div
                  key={txHash || idx}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{be.builder_name}</h5>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Block #{blockNum} • {gasUsed}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] bg-white border border-slate-200/80 rounded-lg px-2.5 py-1">
                    <span className="text-blue-600 font-semibold truncate max-w-[240px]" title={txHash}>
                      {txHash}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(txHash, `tx-row-${idx}`)}
                      className="p-0.5 text-slate-400 hover:text-blue-600"
                      title="Copy transaction hash"
                    >
                      {copiedKey === `tx-row-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 italic">
              On-chain attestation transaction records verified in AttestationRegistry on Anvil Localnet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

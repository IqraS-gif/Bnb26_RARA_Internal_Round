import React, { useState } from 'react';
import { Link2, Copy, Check, CheckCircle2 } from 'lucide-react';

export default function BlockchainNetworkSideCard({ evidence = {} }) {
  const [copiedAddr, setCopiedAddr] = useState(false);

  const chainId = evidence.chain_id || 31337;
  const networkName = 'Anvil Localnet (Development)';
  const contracts = evidence.registry_contracts || {};
  const registryAddr = contracts.builder_registry || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  const handleCopyAddr = () => {
    try {
      navigator.clipboard?.writeText(registryAddr);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    } catch {
      // Fallback
    }
  };

  const truncatedAddr = registryAddr.length > 18
    ? `${registryAddr.slice(0, 14)}...`
    : registryAddr;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Link2 className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Blockchain Network</h3>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Network */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Network</span>
          <span className="font-semibold text-slate-800 text-[11px]">
            {networkName}
          </span>
        </div>

        {/* Chain ID */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Chain ID</span>
          <span className="font-mono font-bold text-slate-900 text-[11px]">
            {chainId}
          </span>
        </div>

        {/* Registry Address */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-slate-500 font-medium">Registry Address</span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
            <span title={registryAddr}>{truncatedAddr}</span>
            <button
              type="button"
              onClick={handleCopyAddr}
              className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
              title="Copy Builder Registry address"
            >
              {copiedAddr ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Connected Banner Box */}
      <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="block text-xs font-bold text-emerald-950">
            Connected
          </span>
          <span className="text-[11px] text-emerald-700 leading-snug">
            Smart contracts are deployed and ready.
          </span>
        </div>
      </div>
    </div>
  );
}

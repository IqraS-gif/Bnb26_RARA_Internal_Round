import React, { useState } from 'react';
import { Users, Copy, Check, Server } from 'lucide-react';

export default function TrustedBuildersSideCard({
  builders = [],
  evidence = {},
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const standardBuilders = [
    {
      name: 'Builder A',
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
    {
      name: 'Builder B',
      address: '0x3C44CdD4606730e81f7127E15e80d49C6788A34F',
    },
    {
      name: 'Builder C',
      address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    },
  ];

  // Map real addresses if provided by backend
  const displayBuilders = standardBuilders.map((sb, idx) => {
    const found = builders.find(
      (b) =>
        (b.builder_name && b.builder_name.toLowerCase() === sb.name.toLowerCase()) ||
        (b.builder_address && b.builder_address.toLowerCase() === sb.address.toLowerCase())
    ) || builders[idx];

    return {
      name: found?.builder_name || sb.name,
      address: found?.builder_address || sb.address,
    };
  });

  const handleCopy = (address, index) => {
    try {
      navigator.clipboard?.writeText(address);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Users className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          Trusted Builders ({displayBuilders.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {displayBuilders.map((builder, idx) => {
          const shortAddr = builder.address
            ? `${builder.address.slice(0, 6)}...${builder.address.slice(-4)}`
            : '0x...';

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <Server className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {builder.name}
                  </h4>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <span title={builder.address}>{shortAddr}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(builder.address, idx)}
                      className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Copy builder address"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Configured
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

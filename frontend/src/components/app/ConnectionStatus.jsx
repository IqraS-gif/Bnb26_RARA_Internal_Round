import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../../services/verification';

export default function ConnectionStatus() {
  const [status, setStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'

  useEffect(() => {
    let isMounted = true;

    const verifyLiveStatus = async () => {
      const isHealthy = await checkBackendHealth();
      if (isMounted) {
        setStatus(isHealthy ? 'connected' : 'disconnected');
      }
    };

    verifyLiveStatus();
    const interval = setInterval(verifyLiveStatus, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isConnected = status === 'connected';
  const isChecking = status === 'checking';

  return (
    <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isChecking ? (
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          ) : isConnected ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}

          <span className={`text-xs font-semibold ${
            isConnected ? 'text-slate-800' : isChecking ? 'text-slate-500' : 'text-rose-700'
          }`}>
            {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {!isConnected && !isChecking && (
          <span className="text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
            Backend Down
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Ethereum/Blockchain Glyph */}
        <div className={`w-8 h-8 rounded-lg bg-white border flex items-center justify-center shrink-0 shadow-2xs ${
          isConnected ? 'border-slate-200/90' : 'border-rose-100 opacity-60'
        }`}>
          <svg viewBox="0 0 64 64" className="w-5 h-5 drop-shadow-2xs" aria-hidden="true">
            <polygon points="32,6 46,26 32,23 18,26" fill={isConnected ? '#93c5fd' : '#cbd5e1'} opacity="0.9" />
            <polygon points="32,6 18,26 32,36" fill={isConnected ? '#60a5fa' : '#94a3b8'} />
            <polygon points="32,6 32,36 46,26" fill={isConnected ? '#3b82f6' : '#64748b'} />
            <polygon points="32,36 18,26 32,54" fill={isConnected ? '#2563eb' : '#475569'} />
            <polygon points="32,36 46,26 32,54" fill={isConnected ? '#1d4ed8' : '#334155'} />
          </svg>
        </div>

        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate">
            {isConnected ? 'Anvil Localnet' : 'Localnet Inactive'}
          </h4>
          <p className="text-[10px] text-slate-500 font-mono truncate">
            {isConnected ? 'Chain ID: 31337' : '127.0.0.1:8000'}
          </p>
        </div>
      </div>
    </div>
  );
}

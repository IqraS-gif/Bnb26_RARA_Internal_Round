import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { testRpcConnection } from '../../services/verification';

export default function BlockchainSettingsCard({
  systemStatus,
  onRefresh,
}) {
  const [rpcUrl, setRpcUrl] = useState(
    systemStatus?.rpc_endpoint || 'http://127.0.0.1:8545'
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testRpcConnection(rpcUrl);
      setTestResult(res);
    } catch (err) {
      setTestResult({
        connected: false,
        error: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const formatShort = (addr) => {
    if (!addr || addr.length < 12) return addr || '—';
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const addresses = systemStatus?.contract_addresses || {
    builder_registry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    release_registry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    attestation_registry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Blockchain Settings
          </h2>
          <p className="text-[11px] text-slate-500">
            Configure blockchain connection and contract addresses.
          </p>
        </div>
      </div>

      {/* Connection Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* Network Selection */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Network
          </label>
          <select
            value="anvil"
            disabled
            className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none cursor-default"
          >
            <option value="anvil">Anvil Localnet</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Ethereum network to connect to.
          </p>
        </div>

        {/* RPC Endpoint + Test Button */}
        <div className="md:col-span-8">
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            RPC Endpoint
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="http://127.0.0.1:8545"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 shadow-2xs"
            >
              {testing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            RPC endpoint for blockchain connection.
          </p>
        </div>
      </div>

      {/* Test Connection Feedback Alert */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border mb-6 text-xs flex items-start gap-2.5 transition-all ${
            testResult.connected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          {testResult.connected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {testResult.connected
                ? 'RPC Connection Successful'
                : 'RPC Connection Failed'}
            </p>
            {testResult.connected ? (
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Connected to <strong>{testResult.network}</strong> (Chain ID:{' '}
                {testResult.chain_id}) &bull; Latest Block: #{testResult.latest_block}{' '}
                &bull; Latency: {testResult.latency_ms}ms
              </p>
            ) : (
              <p className="text-[11px] text-rose-800 mt-0.5">
                {testResult.error || 'Unable to reach the JSON-RPC node.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Smart Contract Addresses */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-800 mb-2">
          Smart Contract Addresses
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* BuilderRegistry */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-800 block">
                BuilderRegistry
              </span>
              <span
                className="text-[11px] font-mono text-slate-500 block truncate"
                title={addresses.builder_registry}
              >
                {formatShort(addresses.builder_registry)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(addresses.builder_registry, 'builder')}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="Copy address"
            >
              {copiedKey === 'builder' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* ReleaseRegistry */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-800 block">
                ReleaseRegistry
              </span>
              <span
                className="text-[11px] font-mono text-slate-500 block truncate"
                title={addresses.release_registry}
              >
                {formatShort(addresses.release_registry)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(addresses.release_registry, 'release')}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="Copy address"
            >
              {copiedKey === 'release' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* AttestationRegistry */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-800 block">
                AttestationRegistry
              </span>
              <span
                className="text-[11px] font-mono text-slate-500 block truncate"
                title={addresses.attestation_registry}
              >
                {formatShort(addresses.attestation_registry)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(addresses.attestation_registry, 'attest')}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="Copy address"
            >
              {copiedKey === 'attest' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status Banner */}
      <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium">
            Connected to{' '}
            <strong className="text-slate-900 font-semibold">
              {systemStatus?.blockchain_network || 'Anvil Localnet'}
            </strong>{' '}
            (Chain ID: {systemStatus?.chain_id || 31337})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-600 font-semibold">
            Latest Block: #{systemStatus?.latest_block ?? 0}
          </span>
          <button
            type="button"
            onClick={handleRefreshClick}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
            title="Refresh blockchain status"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

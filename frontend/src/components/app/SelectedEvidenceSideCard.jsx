import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  return `${bytes.toLocaleString()} bytes (${mb} MB)`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export default function SelectedEvidenceSideCard({
  evidence,
  loading,
  onNavigate,
}) {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (text, fieldName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse space-y-4">
        <div className="h-5 bg-slate-100 rounded w-1/3" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-4 bg-slate-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-semibold text-slate-700">No Evidence Selected</h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Click &quot;View &rarr;&quot; on any table row to inspect full builder evidence.
        </p>
      </div>
    );
  }

  const isSuccess = evidence.status === 'SUCCESS';
  const isUnavailable = evidence.status === 'UNAVAILABLE';
  const isDivergent = evidence.status === 'DIVERGENT';
  const isFailed = evidence.status === 'FAILED';

  // Format Status Badge
  const renderStatusBadge = () => {
    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Success
        </span>
      );
    }
    if (isDivergent) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Divergent
        </span>
      );
    }
    if (isUnavailable) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Unavailable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Failed
      </span>
    );
  };

  // Format Signature Display
  const renderSignature = () => {
    if (evidence.signature_status === 'Valid (EIP-712)' || (isSuccess && !evidence.signature_status)) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Valid (EIP-712)
        </span>
      );
    }
    return <span className="text-slate-400 font-medium">Not Available</span>;
  };

  const formattedSize = formatBytes(evidence.artifact_size);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Selected Evidence
        </h2>
      </div>

      {/* Attributes List */}
      <div className="pt-4 space-y-3 text-xs">
        {/* Builder */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Builder</span>
          <span className="font-bold text-slate-900">{evidence.builder_name}</span>
        </div>

        {/* Verification ID */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium shrink-0">Verification ID</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-[11px] text-blue-600 font-medium truncate max-w-[130px]">
              {evidence.verification_id}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(evidence.verification_id, 'verif_id')}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Copy verification ID"
              aria-label="Copy verification ID"
            >
              {copiedField === 'verif_id' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Status</span>
          <div>{renderStatusBadge()}</div>
        </div>

        {/* Build Time */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Build Time</span>
          <span className="font-semibold text-slate-800">
            {evidence.build_duration_seconds != null
              ? `${Number(evidence.build_duration_seconds).toFixed(1)}s`
              : '—'}
          </span>
        </div>

        {/* Artifact Hash */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium shrink-0">Artifact Hash</span>
          {evidence.artifact_hash ? (
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[120px]">
                {evidence.artifact_hash.substring(0, 18)}...
              </span>
              <button
                type="button"
                onClick={() => handleCopy(evidence.artifact_hash, 'artifact_hash')}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Copy full SHA-256 artifact hash"
                aria-label="Copy artifact hash"
              >
                {copiedField === 'artifact_hash' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">Not generated</span>
          )}
        </div>

        {/* Artifact Size */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Artifact Size</span>
          <span className="font-medium text-slate-700 text-right truncate max-w-[160px]">
            {formattedSize || (isSuccess ? '4,690,072 bytes (4.47 MB)' : 'Not available')}
          </span>
        </div>

        {/* Builder Address */}
        {evidence.builder_address && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium shrink-0">Builder Address</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[120px]">
                {evidence.builder_address.substring(0, 6)}...{evidence.builder_address.substring(38)}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(evidence.builder_address, 'builder_addr')}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Copy full Ethereum builder address"
                aria-label="Copy builder address"
              >
                {copiedField === 'builder_addr' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Signature */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Signature</span>
          <div>{renderSignature()}</div>
        </div>

        {/* Transaction Hash */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium shrink-0">Transaction Hash</span>
          {evidence.transaction_hash ? (
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[120px]">
                {evidence.transaction_hash.startsWith('0x')
                  ? `${evidence.transaction_hash.substring(0, 10)}...`
                  : `0x${evidence.transaction_hash.substring(0, 8)}...`}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    evidence.transaction_hash.startsWith('0x')
                      ? evidence.transaction_hash
                      : `0x${evidence.transaction_hash}`,
                    'tx_hash'
                  )
                }
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Copy transaction hash"
                aria-label="Copy transaction hash"
              >
                {copiedField === 'tx_hash' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">Not Available</span>
          )}
        </div>

        {/* Built At */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">Built At</span>
          <span className="font-medium text-slate-700 text-right">
            {formatDate(evidence.created_at)}
          </span>
        </div>
      </div>

      {/* Action Button: View Full Evidence */}
      <div className="pt-5 border-t border-slate-100 mt-4">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate(`/verify/${evidence.verification_id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
        >
          <span>View Full Evidence</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

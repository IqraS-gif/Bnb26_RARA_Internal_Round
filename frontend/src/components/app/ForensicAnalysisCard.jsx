import React, { useState } from 'react';
import { Search, ArrowRight, Check, X, ShieldAlert } from 'lucide-react';

export default function ForensicAnalysisCard({ verificationId, onNavigate }) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (onNavigate && verificationId) {
      onNavigate(`/verify/${verificationId}/forensics`);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 animate-fade-in">
        <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
          <Search className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900">Forensic Analysis</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Compare the differing artifacts to see exactly what changed between the builds.
        </p>

        <button
          type="button"
          onClick={handleClick}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Compare Artifacts</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Forensic Placeholder Information Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Forensic Comparison
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Binary Disassembly & Diff
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Forensic comparison pinpoints byte-level header and executable differences between reference builds (<code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">bed775...</code>) and conflicting builder artifacts (<code className="font-mono text-rose-700 bg-rose-50 px-1 py-0.5 rounded">3010ad...</code>).
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DangerZoneCard({ onOpenClearModal }) {
  return (
    <div className="bg-white border border-rose-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-rose-100">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Danger Zone
            </h2>
            <p className="text-[11px] text-slate-500">
              Irreversible actions. Use with caution.
            </p>
          </div>
        </div>

        {/* Clear History Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenClearModal}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100/80 text-rose-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer group"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span>Clear All Verification History</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Permanently delete all stored verification records.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { AlertTriangle, Trash2, X, AlertOctagon } from 'lucide-react';

export default function ClearHistoryModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full p-6 text-left relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Clear All Verification History
            </h3>
            <p className="text-xs text-slate-500">
              Irreversible database wipe action
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-900 leading-relaxed mb-5">
          <p className="font-semibold mb-1">
            Warning: This action cannot be undone.
          </p>
          <p className="text-[11px] text-rose-800">
            All stored verification runs, builder output logs, SHA-256 evidence records, and consensus verdicts will be permanently deleted from the persistent database.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete All History'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

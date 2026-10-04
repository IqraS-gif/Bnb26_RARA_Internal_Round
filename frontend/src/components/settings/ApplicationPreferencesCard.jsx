import React, { useState } from 'react';
import { Sliders, Check } from 'lucide-react';

export default function ApplicationPreferencesCard({
  preferences,
  onUpdatePreferences,
}) {
  const [pageSize, setPageSize] = useState(preferences?.pageSize || 10);
  const [autoRefresh, setAutoRefresh] = useState(
    preferences?.autoRefresh || '30s'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handlePageSizeChange = (val) => {
    const num = parseInt(val, 10);
    setPageSize(num);
    if (onUpdatePreferences) {
      onUpdatePreferences({ pageSize: num, autoRefresh });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRefreshChange = (val) => {
    setAutoRefresh(val);
    if (onUpdatePreferences) {
      onUpdatePreferences({ pageSize, autoRefresh: val });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Application Preferences
              </h2>
              <p className="text-[11px] text-slate-500">
                Customize the application experience.
              </p>
            </div>
          </div>

          {isSaved && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Theme
            </label>
            <select
              value="light"
              disabled
              className="w-full px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none cursor-default"
            >
              <option value="light">Light (Default)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Choose the application theme.
            </p>
          </div>

          {/* Table Page Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Table Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Number of items per page in tables.
            </p>
          </div>

          {/* Auto-refresh Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Auto-refresh Interval
            </label>
            <select
              value={autoRefresh}
              onChange={(e) => handleRefreshChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="30s">30 seconds</option>
              <option value="60s">60 seconds</option>
              <option value="off">Off (Manual refresh)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Auto-refresh for blockchain data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

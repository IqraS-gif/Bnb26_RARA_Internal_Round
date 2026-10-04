import React, { useState } from 'react';
import { Settings2, Info, Check } from 'lucide-react';

const VERIFICATION_MODES = [
  'Normal Verification',
  'Builder A Offline',
  'Builder B Offline',
  'Builder C Offline',
  'Builders A + B Offline',
  'Builders A + C Offline',
  'Builders B + C Offline',
  'Builder C Divergent',
];

export default function VerificationSettingsCard({
  settings,
  onSavePreferences,
}) {
  const [repo, setRepo] = useState(settings?.default_repository || 'junegunn/fzf');
  const [tag, setTag] = useState(settings?.default_release_tag || 'v0.74.4');
  const [mode, setMode] = useState(settings?.default_mode || 'Normal Verification');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (newRepo, newTag, newMode) => {
    setRepo(newRepo);
    setTag(newTag);
    setMode(newMode);
    if (onSavePreferences) {
      onSavePreferences({
        default_repository: newRepo,
        default_release_tag: newTag,
        default_mode: newMode,
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Verification Settings
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure default options for release verification runs.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Default Repository */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Default Repository
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => handleSave(e.target.value, tag, mode)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="junegunn/fzf"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Default repository for new verification runs.
            </p>
          </div>

          {/* Default Release Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Default Release Tag
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => handleSave(repo, e.target.value, mode)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="v0.74.4"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Default release tag for new verification runs.
            </p>
          </div>

          {/* Verification Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Verification Mode
            </label>
            <select
              value={mode}
              onChange={(e) => handleSave(repo, tag, e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              {VERIFICATION_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Default mode for verification runs.
            </p>
          </div>

          {/* Quorum Policy */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Quorum Policy
            </label>
            <div className="px-3 py-2 bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-semibold flex items-center justify-between cursor-default">
              <span>{settings?.quorum_policy?.label || '2 of 3 (Current)'}</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Fixed Policy
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {settings?.quorum_policy?.description || 'Number of trusted builders required for acceptance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Note banner */}
      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 mt-2">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          Only trusted builders that provide valid evidence are considered during quorum evaluation.
        </span>
      </div>
    </div>
  );
}

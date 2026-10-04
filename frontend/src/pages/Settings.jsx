import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Home, RotateCw, AlertCircle } from 'lucide-react';
import {
  getSystemStatus,
  clearAllVerificationHistory,
} from '../services/verification';
import VerificationSettingsCard from '../components/settings/VerificationSettingsCard';
import TrustedBuildersCard from '../components/settings/TrustedBuildersCard';
import SystemInfoSideCard from '../components/settings/SystemInfoSideCard';
import BlockchainSettingsCard from '../components/settings/BlockchainSettingsCard';
import DataStorageCard from '../components/settings/DataStorageCard';
import ApplicationPreferencesCard from '../components/settings/ApplicationPreferencesCard';
import DangerZoneCard from '../components/settings/DangerZoneCard';
import ClearHistoryModal from '../components/settings/ClearHistoryModal';

const PREFS_KEY = 'quorum_user_preferences';

export default function Settings({ onNavigate }) {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local preferences state
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      default_repository: 'junegunn/fzf',
      default_release_tag: 'v0.74.4',
      default_mode: 'Normal Verification',
      pageSize: 10,
      autoRefresh: '30s',
    };
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemStatus();
      setSystemStatus(data);
    } catch (err) {
      setError(err.message || 'Failed to load system settings and status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePreferences = (newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleConfirmClearHistory = async () => {
    setIsDeleting(true);
    try {
      await clearAllVerificationHistory();
      setIsClearModalOpen(false);
      // Reload system status to update counts
      await loadData();
    } catch (err) {
      alert(`Failed to clear history: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearCache = () => {
    // Clear local storage cache
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Header & Breadcrumb */}
      <div className="mb-6">
        <nav
          className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-semibold">Settings</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure your Quorum application preferences and view system information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-6 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="font-semibold underline hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && !systemStatus ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-600 font-medium">
            Loading system settings and node status...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Verification Settings, Trusted Builders, System Information */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Verification Settings (Left, 4 or 5 cols) */}
            <div className="lg:col-span-5">
              <VerificationSettingsCard
                settings={systemStatus}
                onSavePreferences={handleUpdatePreferences}
              />
            </div>

            {/* Trusted Builders (Middle, 4 cols) */}
            <div className="lg:col-span-4">
              <TrustedBuildersCard
                trustedBuilders={systemStatus?.trusted_builders || []}
              />
            </div>

            {/* System Information (Right, 3 cols) */}
            <div className="lg:col-span-3">
              <SystemInfoSideCard systemStatus={systemStatus} />
            </div>
          </div>

          {/* Row 2: Blockchain Settings (8 cols) & Data Storage (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <BlockchainSettingsCard
                systemStatus={systemStatus}
                onRefresh={loadData}
              />
            </div>
            <div className="lg:col-span-4">
              <DataStorageCard
                storage={systemStatus?.storage}
                onNavigate={onNavigate}
                onClearCache={handleClearCache}
              />
            </div>
          </div>

          {/* Row 3: Application Preferences (8 cols) & Danger Zone (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <ApplicationPreferencesCard
                preferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
              />
            </div>
            <div className="lg:col-span-4">
              <DangerZoneCard
                onOpenClearModal={() => setIsClearModalOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ClearHistoryModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearHistory}
        isDeleting={isDeleting}
      />
    </div>
  );
}

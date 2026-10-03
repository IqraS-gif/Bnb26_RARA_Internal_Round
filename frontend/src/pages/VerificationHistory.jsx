import React, { useState, useEffect, useCallback } from 'react';
import {
  getVerificationHistory,
  getVerificationHistorySummary,
} from '../services/verification';
import HistorySummaryCards from '../components/app/HistorySummaryCards';
import HistoryFilterBar from '../components/app/HistoryFilterBar';
import HistoryTable from '../components/app/HistoryTable';
import HistoryPagination from '../components/app/HistoryPagination';

export default function VerificationHistory({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    accepted: 0,
    accepted_with_warning: 0,
    rejected: 0,
  });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [verdict, setVerdict] = useState('ALL');
  const [verificationMode, setVerificationMode] = useState('ALL');
  const [repository, setRepository] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');
  const [repositoriesList, setRepositoriesList] = useState([]);

  // Fetch summary counts
  const loadSummary = useCallback(async () => {
    try {
      const sumData = await getVerificationHistorySummary();
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load history summary counts:', err);
    }
  }, []);

  // Fetch history items
  const loadHistory = useCallback(async (currentPage, currentSearch, currentVerdict, currentMode, currentRepo) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (currentSearch && currentSearch.trim()) {
        params.search = currentSearch.trim();
      }
      if (currentVerdict && currentVerdict !== 'ALL') {
        params.verdict = currentVerdict;
      }
      if (currentMode && currentMode !== 'ALL') {
        params.verification_mode = currentMode;
      }
      if (currentRepo && currentRepo !== 'ALL') {
        params.repository = currentRepo;
      }

      const res = await getVerificationHistory(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);

      // Collect unique repositories for dropdown
      if (res.items && res.items.length > 0) {
        setRepositoriesList((prev) => {
          const combined = new Set([...prev, ...res.items.map((i) => i.repository)]);
          return Array.from(combined).filter(Boolean);
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to load verification history.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Load summary on mount
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory(page, search, verdict, verificationMode, repository);
    }, 150);

    return () => clearTimeout(timer);
  }, [page, search, verdict, verificationMode, repository, loadHistory]);

  const handleClearFilters = () => {
    setSearch('');
    setVerdict('ALL');
    setVerificationMode('ALL');
    setRepository('ALL');
    setDateRange('all');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ==================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ==================================================== */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            Home
          </a>
          <span>&gt;</span>
          <span className="text-slate-900 font-semibold" aria-current="page">
            Verification History
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Verification History
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Review previous release verification runs and their evidence.
        </p>
      </div>

      {/* ==================================================== */}
      {/* 2. SUMMARY CARDS */}
      {/* ==================================================== */}
      <HistorySummaryCards
        summary={summary}
        loading={loading && total === 0}
      />

      {/* ==================================================== */}
      {/* 3. SEARCH AND FILTERS */}
      {/* ==================================================== */}
      <HistoryFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        verdict={verdict}
        onVerdictChange={(val) => {
          setVerdict(val);
          setPage(1);
        }}
        verificationMode={verificationMode}
        onModeChange={(val) => {
          setVerificationMode(val);
          setPage(1);
        }}
        repository={repository}
        onRepositoryChange={(val) => {
          setRepository(val);
          setPage(1);
        }}
        repositoriesList={repositoriesList}
        dateRange={dateRange}
        onDateRangeChange={(val) => {
          setDateRange(val);
          setPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* ==================================================== */}
      {/* 4. HISTORY TABLE */}
      {/* ==================================================== */}
      <HistoryTable
        items={items}
        loading={loading}
        error={error}
        onNavigate={onNavigate}
        onRetry={() => {
          loadSummary();
          loadHistory(page, search, verdict, verificationMode, repository);
        }}
      />

      {/* ==================================================== */}
      {/* 5. PAGINATION */}
      {/* ==================================================== */}
      <HistoryPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </main>
  );
}

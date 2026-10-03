import React, { useState, useEffect, useCallback } from 'react';
import {
  getBuilderEvidence,
  getBuilderEvidenceSummary,
} from '../services/verification';
import BuilderEvidenceSummaryCards from '../components/app/BuilderEvidenceSummaryCards';
import BuilderEvidenceFilterBar from '../components/app/BuilderEvidenceFilterBar';
import BuilderEvidenceTable from '../components/app/BuilderEvidenceTable';
import BuilderEvidencePagination from '../components/app/BuilderEvidencePagination';
import ReleaseContextSideCard from '../components/app/ReleaseContextSideCard';
import BuilderFilterSideCard from '../components/app/BuilderFilterSideCard';
import SelectedEvidenceSideCard from '../components/app/SelectedEvidenceSideCard';

export default function BuilderEvidence({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total_runs: 0,
    successful_builds: 0,
    failed_or_unavailable: 0,
    divergent_artifacts: 0,
    success_rate_percent: 0.0,
    unavailable_percent: 0.0,
    divergent_percent: 0.0,
    total_verifications: 0,
    builder_counts: { all: 0, builder_a: 0, builder_b: 0, builder_c: 0 },
  });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [builder, setBuilder] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [verificationId, setVerificationId] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');
  const [verificationIdsList, setVerificationIdsList] = useState([]);

  // Fetch summary counts
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const sumData = await getBuilderEvidenceSummary();
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load builder evidence summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch builder evidence records
  const loadEvidence = useCallback(
    async (
      currentPage,
      currentSearch,
      currentBuilder,
      currentStatus,
      currentVerifId,
      currentDateRange
    ) => {
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
        if (currentBuilder && currentBuilder !== 'ALL') {
          params.builder = currentBuilder;
        }
        if (currentStatus && currentStatus !== 'ALL') {
          params.status = currentStatus;
        }
        if (currentVerifId && currentVerifId !== 'ALL') {
          params.verification_id = currentVerifId;
        }
        if (currentDateRange && currentDateRange !== 'all') {
          params.date_range = currentDateRange;
        }

        const res = await getBuilderEvidence(params);
        const evidenceItems = res.items || [];
        setItems(evidenceItems);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);

        // Keep or auto-select selectedEvidence
        if (evidenceItems.length > 0) {
          setSelectedEvidence((prev) => {
            if (prev) {
              const matched = evidenceItems.find((i) => i.id === prev.id);
              if (matched) return matched;
            }
            return evidenceItems[0];
          });

          // Collect unique verification IDs for dropdown
          setVerificationIdsList((prev) => {
            const combined = new Set([
              ...prev,
              ...evidenceItems.map((i) => i.verification_id),
            ]);
            return Array.from(combined).filter(Boolean);
          });
        } else {
          setSelectedEvidence(null);
        }
      } catch (err) {
        setError(err.message || 'Unable to load builder evidence.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Load summary on mount
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Debounced search & filter reload
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvidence(page, search, builder, status, verificationId, dateRange);
    }, 150);

    return () => clearTimeout(timer);
  }, [page, search, builder, status, verificationId, dateRange, loadEvidence]);

  const handleClearFilters = () => {
    setSearch('');
    setBuilder('ALL');
    setStatus('ALL');
    setVerificationId('ALL');
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
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-500 mb-2"
        >
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
            Builder Evidence
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Builder Evidence
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          View and explore evidence generated by trusted builders across all verification runs.
        </p>
      </div>

      {/* ==================================================== */}
      {/* 2. SUMMARY CARDS */}
      {/* ==================================================== */}
      <BuilderEvidenceSummaryCards
        summary={summary}
        loading={summaryLoading && total === 0}
      />

      {/* ==================================================== */}
      {/* 3. MAIN CONTENT: TABLE (LEFT) + SIDE PANELS (RIGHT) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filter Bar + Table + Pagination (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <BuilderEvidenceFilterBar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            builder={builder}
            onBuilderChange={(val) => {
              setBuilder(val);
              setPage(1);
            }}
            status={status}
            onStatusChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            verificationId={verificationId}
            onVerificationIdChange={(val) => {
              setVerificationId(val);
              setPage(1);
            }}
            verificationIdsList={verificationIdsList}
            dateRange={dateRange}
            onDateRangeChange={(val) => {
              setDateRange(val);
              setPage(1);
            }}
            onClearFilters={handleClearFilters}
          />

          <BuilderEvidenceTable
            items={items}
            loading={loading}
            error={error}
            selectedId={selectedEvidence?.id}
            onSelectEvidence={setSelectedEvidence}
            onNavigate={onNavigate}
            onRetry={() => {
              loadSummary();
              loadEvidence(page, search, builder, status, verificationId, dateRange);
            }}
            pageOffset={(page - 1) * pageSize}
          />

          <BuilderEvidencePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Right Column: Release Context + Builder Filter + Selected Evidence (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <ReleaseContextSideCard
            context={selectedEvidence}
            loading={loading && !selectedEvidence}
          />

          <BuilderFilterSideCard
            selectedBuilder={builder}
            onSelectBuilder={(b) => {
              setBuilder(b);
              setPage(1);
            }}
            builderCounts={summary?.builder_counts}
            loading={summaryLoading}
          />

          <SelectedEvidenceSideCard
            evidence={selectedEvidence}
            loading={loading && !selectedEvidence}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </main>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  getBlockchainSummary,
  getBlockchainEvents,
  getRecentAttestations,
} from '../services/verification';
import BlockchainSummaryCards from '../components/app/BlockchainSummaryCards';
import BlockchainActivityTable from '../components/app/BlockchainActivityTable';
import BlockchainNetworkContextSideCard from '../components/app/BlockchainNetworkContextSideCard';
import BlockchainContractAddressesSideCard from '../components/app/BlockchainContractAddressesSideCard';
import BlockchainRecentAttestationsSideCard from '../components/app/BlockchainRecentAttestationsSideCard';
import BlockchainEventTypesSideCard from '../components/app/BlockchainEventTypesSideCard';
import BlockchainRegistriesBottomCard from '../components/app/BlockchainRegistriesBottomCard';
import BlockchainEventDetailModal from '../components/app/BlockchainEventDetailModal';

export default function Blockchain({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [eventType, setEventType] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');

  const [recentAttestations, setRecentAttestations] = useState([]);
  const [attestationsLoading, setAttestationsLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load summary
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await getBlockchainSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load blockchain summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load recent attestations
  const loadRecentAttestations = useCallback(async () => {
    setAttestationsLoading(true);
    try {
      const data = await getRecentAttestations(3);
      setRecentAttestations(data || []);
    } catch (err) {
      console.error('Failed to load recent attestations:', err);
    } finally {
      setAttestationsLoading(false);
    }
  }, []);

  // Load events
  const loadEvents = useCallback(
    async (currentPage, currentEventType, currentDateRange) => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const params = {
          page: currentPage,
          page_size: pageSize,
        };
        if (currentEventType && currentEventType !== 'ALL') {
          params.event_type = currentEventType;
        }

        const res = await getBlockchainEvents(params);
        setEvents(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        setEventsError(err.message || 'Unable to load blockchain events.');
      } finally {
        setEventsLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    loadSummary();
    loadRecentAttestations();
  }, [loadSummary, loadRecentAttestations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents(page, eventType, dateRange);
    }, 150);

    return () => clearTimeout(timer);
  }, [page, eventType, dateRange, loadEvents]);

  const handleSelectAttestation = (att) => {
    // Find matching full event or synthesize for modal
    const matched = events.find(
      (e) => e.transaction_hash.toLowerCase() === att.transaction_hash.toLowerCase()
    );
    if (matched) {
      setSelectedEvent(matched);
    } else {
      setSelectedEvent({
        event_name: 'AttestationSubmitted',
        registry_name: 'AttestationRegistry',
        contract_address: summary?.contract_addresses?.attestation_registry || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        block_number: att.block_number,
        transaction_hash: att.transaction_hash,
        formatted_timestamp: att.formatted_timestamp,
        status: att.status,
        args: {
          builderAddress: att.builder_address,
          releaseId: att.release_id,
          artifactHash: att.artifact_hash,
        },
      });
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
            Blockchain
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Blockchain Evidence
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Inspect the immutable audit trail created by Quorum during verification.
        </p>
      </div>

      {/* ==================================================== */}
      {/* 2. SUMMARY CARDS */}
      {/* ==================================================== */}
      <BlockchainSummaryCards summary={summary} loading={summaryLoading} />

      {/* ==================================================== */}
      {/* 3. MAIN SECTION: ACTIVITY TABLE (LEFT) + RIGHT RAIL */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Activity Table (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <BlockchainActivityTable
            events={events}
            total={total}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            loading={eventsLoading}
            error={eventsError}
            eventType={eventType}
            onEventTypeChange={(val) => {
              setEventType(val);
              setPage(1);
            }}
            dateRange={dateRange}
            onDateRangeChange={(val) => {
              setDateRange(val);
              setPage(1);
            }}
            onPageChange={(newPage) => {
              if (newPage >= 1 && newPage <= totalPages) {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onSelectEvent={setSelectedEvent}
            onRetry={() => {
              loadSummary();
              loadRecentAttestations();
              loadEvents(page, eventType, dateRange);
            }}
          />
        </div>

        {/* Right: Network Context + Addresses + Recent Attestations + Event Types (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <BlockchainNetworkContextSideCard
            summary={summary}
            loading={summaryLoading}
          />

          <BlockchainContractAddressesSideCard
            addresses={summary?.contract_addresses}
            loading={summaryLoading}
          />

          <BlockchainRecentAttestationsSideCard
            attestations={recentAttestations}
            loading={attestationsLoading}
            onSelectAttestation={handleSelectAttestation}
            onViewAll={() => {
              setEventType('AttestationSubmitted');
              setPage(1);
            }}
          />

          <BlockchainEventTypesSideCard />
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. BOTTOM SECTION: DEPLOYED SMART CONTRACT REGISTRIES */}
      {/* ==================================================== */}
      <BlockchainRegistriesBottomCard
        addresses={summary?.contract_addresses}
        loading={summaryLoading}
      />

      {/* ==================================================== */}
      {/* 5. EVENT DETAIL MODAL */}
      {/* ==================================================== */}
      {selectedEvent && (
        <BlockchainEventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </main>
  );
}

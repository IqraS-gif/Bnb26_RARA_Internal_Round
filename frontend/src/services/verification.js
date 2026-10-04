import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000,
});

export const FZF_DEMO_PAYLOAD = {
  release_id: 'fzf-v0.74.4',
  repository: 'https://github.com/junegunn/fzf.git',
  release_tag: 'v0.74.4',
  source_commit: 'a140afeb4d733cad3c96a56bf6db7e26853b6757',
  expected_artifact_hash: 'bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3',
  artifact_reference: 'junegunn/fzf/releases/download/v0.74.4/fzf',
};

/**
 * Execute release verification against the real FastAPI backend.
 * @param {Object} [payload] - Optional verification request payload (defaults to fzf demo)
 * @returns {Promise<Object>} VerificationResponse
 */
export async function runVerification(payload = FZF_DEMO_PAYLOAD) {
  try {
    const response = await apiClient.post('/api/v1/verification/run', payload);
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (Array.isArray(error.response?.data?.detail)) {
      const msg = error.response.data.detail
        .map((item) => item.msg || item.message || String(item))
        .join('; ');
      throw new Error(`Validation Error: ${msg}`);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message && !error.message.includes('object Object')) {
      throw new Error(error.message);
    }
    throw new Error('Verification service could not be reached.');
  }
}

/**
 * Start an asynchronous verification job for step-by-step progress tracking.
 * @param {Object} payload
 * @returns {Promise<{job_id: string, status: string}>}
 */
export async function startVerificationJob(payload = FZF_DEMO_PAYLOAD) {
  try {
    const response = await apiClient.post('/api/v1/verification/jobs', payload);
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (Array.isArray(error.response?.data?.detail)) {
      const msg = error.response.data.detail
        .map((item) => item.msg || item.message || String(item))
        .join('; ');
      throw new Error(`Validation Error: ${msg}`);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to start verification job.');
  }
}

/**
 * Get real-time status and stage progress of an asynchronous verification job.
 * @param {string} jobId
 * @returns {Promise<Object>} VerificationJobStatus
 */
export async function getVerificationJob(jobId) {
  try {
    const response = await apiClient.get(`/api/v1/verification/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch verification job status.');
  }
}

/**
 * Resolve release tag to commit and check ecosystem support.
 * @param {Object} params - { repository: string, release_tag: string }
 * @returns {Promise<Object>} { repository, release_tag, resolved_commit, is_go_supported, message }
 */
export async function resolveUpstreamTag({ repository, release_tag }) {
  try {
    const response = await apiClient.post('/api/v1/verification/resolve-tag', {
      repository,
      release_tag,
    });
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to resolve release tag.');
  }
}

/**
 * Check health status of backend service.
 * @returns {Promise<boolean>} True if backend is reachable and healthy
 */
export async function checkBackendHealth() {
  try {
    const response = await apiClient.get('/api/v1/health', { timeout: 8000 });
    return response.data?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Get existing verification result by ID.
 * @param {string} verificationId
 * @returns {Promise<Object>} VerificationResponse
 */
export async function getVerificationResult(verificationId) {
  try {
    const response = await apiClient.get(`/api/v1/verification/${verificationId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Verification record '${verificationId}' not found.`);
    }
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve verification record.');
  }
}

/**
 * Query paginated verification history.
 * @param {Object} [params] - Query parameters (search, verdict, verification_mode, repository, page, page_size)
 * @returns {Promise<Object>} VerificationHistoryListResponse
 */
export async function getVerificationHistory(params = {}) {
  try {
    const response = await apiClient.get('/api/v1/verification/history', { params });
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve verification history.');
  }
}

/**
 * Get aggregate summary counts for verification history.
 * @returns {Promise<Object>} VerificationHistorySummaryResponse
 */
export async function getVerificationHistorySummary() {
  try {
    const response = await apiClient.get('/api/v1/verification/history/summary');
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve verification history summary.');
  }
}

/**
 * Get detailed verification history record by verification ID.
 * @param {string} verificationId
 * @returns {Promise<Object>} VerificationHistoryDetailResponse
 */
export async function getVerificationHistoryDetail(verificationId) {
  try {
    const response = await apiClient.get(`/api/v1/verification/history/${verificationId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Verification history record '${verificationId}' not found.`);
    }
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve verification history detail.');
  }
}

/**
 * Query paginated builder evidence with filtering.
 * @param {Object} [params] - Query parameters (search, builder, status, verification_id, repository, date_range, page, page_size)
 * @returns {Promise<Object>} BuilderEvidenceListResponse
 */
export async function getBuilderEvidence(params = {}) {
  try {
    const response = await apiClient.get('/api/v1/builder-evidence', { params });
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve builder evidence.');
  }
}

/**
 * Get aggregate summary counts for builder evidence.
 * @returns {Promise<Object>} BuilderEvidenceSummaryResponse
 */
export async function getBuilderEvidenceSummary() {
  try {
    const response = await apiClient.get('/api/v1/builder-evidence/summary');
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve builder evidence summary.');
  }
}

/**
 * Get blockchain summary status, chain ID, and contract addresses.
 * @returns {Promise<Object>} BlockchainSummaryResponse
 */
export async function getBlockchainSummary() {
  try {
    const response = await apiClient.get('/api/v1/blockchain/summary');
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve blockchain summary.');
  }
}

/**
 * Query paginated and decoded smart contract events.
 * @param {Object} [params] - Query parameters (event_type, registry, search, page, page_size)
 * @returns {Promise<Object>} BlockchainEventsResponse
 */
export async function getBlockchainEvents(params = {}) {
  try {
    const response = await apiClient.get('/api/v1/blockchain/events', { params });
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve blockchain events.');
  }
}

/**
 * Get recent AttestationSubmitted records from Anvil.
 * @param {number} [limit=5]
 * @returns {Promise<Array>} List of RecentAttestationItem
 */
export async function getRecentAttestations(limit = 5) {
  try {
    const response = await apiClient.get('/api/v1/blockchain/attestations', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve recent attestations.');
  }
}

/**
 * Get unified system status and metrics.
 * @returns {Promise<Object>} SystemStatusResponse
 */
export async function getSystemStatus() {
  try {
    const response = await apiClient.get('/api/v1/system/status');
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to retrieve system status.');
  }
}

/**
 * Test live RPC connection and latency.
 * @param {string} [rpcUrl]
 * @returns {Promise<Object>} RpcTestResponse
 */
export async function testRpcConnection(rpcUrl = null) {
  try {
    const response = await apiClient.post('/api/v1/system/test-rpc', {
      rpc_url: rpcUrl,
    });
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to test RPC connection.');
  }
}

/**
 * Permanently delete all verification history and builder records.
 * @returns {Promise<Object>}
 */
export async function clearAllVerificationHistory() {
  try {
    const response = await apiClient.delete('/api/v1/verification/history');
    return response.data;
  } catch (error) {
    if (typeof error.response?.data?.detail === 'string') {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('Failed to clear verification history.');
  }
}




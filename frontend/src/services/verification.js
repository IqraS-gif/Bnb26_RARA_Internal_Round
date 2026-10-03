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

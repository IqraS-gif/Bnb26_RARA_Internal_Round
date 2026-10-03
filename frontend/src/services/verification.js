import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
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
    const response = await apiClient.get('/api/v1/health', { timeout: 3500 });
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
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to retrieve verification record.');
  }
}

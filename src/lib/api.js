import { supabase } from './supabaseClient';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...options.headers
  };

  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.message || 'Request failed.');
  }

  return body;
}

// Candidate results helpers
export async function listCandidateResults(query = {}) {
  const params = new URLSearchParams(query).toString();
  return api(`/candidate-results${params ? `?${params}` : ''}`);
}

export async function createCandidateResult(payload) {
  return api('/candidate-results', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getCandidateResult(id) {
  return api(`/candidate-results/${id}`);
}

export async function deleteCandidateResult(id) {
  return api(`/candidate-results/${id}`, { method: 'DELETE' });
}

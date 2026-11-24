export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://firebackend-4k60.onrender.com' : '')
).replace(/\/+$/, '');

export async function checkServerHealth(timeoutMs = 3500) {
  const url = `${API_BASE}/health`;
  const start = Date.now();
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const latency = Date.now() - start;
  return { ok: true, data, latency };
}

export const getAuthToken = () => {
  return localStorage.getItem('car_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('car_token', token);
  } else {
    localStorage.removeItem('car_token');
  }
};

export const getAdminKey = () => {
  return localStorage.getItem('car_admin_key') || '';
};

export const setAdminKey = (key) => {
  if (key) {
    localStorage.setItem('car_admin_key', key);
  } else {
    localStorage.removeItem('car_admin_key');
  }
};

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();
  const adminKey = getAdminKey();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

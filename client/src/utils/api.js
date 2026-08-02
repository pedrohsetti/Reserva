const BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000'
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : ''
  )
);

export async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed');
  }
  const data = await res.json();
  // assume token is in data.token or data.accessToken
  return data.token || data.accessToken || data;
}

export async function getCurrentUser(token) {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to get user');
  return res.json();
}

export function fetchWithAuth(path, token, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  return fetch(url, { ...opts, headers });
}

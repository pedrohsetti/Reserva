const BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000'
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : ''
  )
);

// Export BASE_URL as API_URL for compatibility
export const API_URL = BASE_URL;

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

export async function register({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Registration failed');
  }
  const data = await res.json();
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

export function withBusinessHeaders(headers = {}, businessId) {
  if (!businessId) {
    return headers;
  }

  return {
    ...headers,
    'x-business-id': businessId,
  };
}

export function fetchWithBusiness(path, token, businessId, opts = {}) {
  return fetchWithAuth(path, token, {
    ...opts,
    headers: withBusinessHeaders(opts.headers || {}, businessId),
  });
}

async function fetchJsonWithAuth(path, token, opts = {}, fallbackMessage = 'Request failed') {
  const res = await fetchWithAuth(path, token, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fallbackMessage);
  }
  return res.json();
}

export async function fetchJsonWithBusiness(path, token, businessId, opts = {}, fallbackMessage = 'Request failed') {
	const res = await fetchWithBusiness(path, token, businessId, opts);
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || fallbackMessage);
	}
	return res.json();
}

export function discoverBusinesses(token) {
  return fetchJsonWithAuth('/api/businesses/discover', token, {}, 'Failed to load businesses');
}

export function discoverServices(token, businessId) {
  const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  return fetchJsonWithAuth(`/api/services/discover${query}`, token, {}, 'Failed to load services');
}

export function discoverEvents(token, businessId) {
  const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
  return fetchJsonWithAuth(`/api/events/discover${query}`, token, {}, 'Failed to load events');
}

export function joinBusiness(businessId, token) {
  return fetchJsonWithAuth(`/api/customers/join-business/${businessId}`, token, {
    method: 'POST',
  }, 'Failed to join business');
}

export function getMyCustomer(token) {
  return fetchJsonWithAuth('/api/customers/me', token, {}, 'Failed to load customer profile');
}

export function getServiceSlots(serviceId, token, options = {}) {
  const params = new URLSearchParams();
  if (options.startDate) params.set('startDate', options.startDate);
  if (options.endDate) params.set('endDate', options.endDate);
  if (options.daysToShow) params.set('daysToShow', String(options.daysToShow));
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchJsonWithAuth(`/api/services/${serviceId}/slots${query}`, token, {}, 'Failed to load service slots');
}

export function createAppointment(payload, token) {
  return fetchJsonWithAuth('/api/appointments', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 'Failed to create appointment');
}

export function fetchEvents(token) {
  return fetchJsonWithAuth('/api/events', token, {}, 'Failed to load events');
}

export function registerForEvent(eventId, token) {
  return fetchJsonWithAuth(`/api/events/${eventId}/register`, token, {
    method: 'POST',
  }, 'Failed to register for event');
}

export function unregisterFromEvent(eventId, token) {
  return fetchJsonWithAuth(`/api/events/${eventId}/register`, token, {
    method: 'DELETE',
  }, 'Failed to unregister from event');
}

export async function changePassword(userId, { currentPassword, newPassword, confirmPassword }, token) {
  const res = await fetchWithAuth(`/api/users/${userId}/password`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Password change failed');
  }
  return res.json();
}

export async function deleteAccount(userId, { password }, token) {
  const res = await fetchWithAuth(`/api/users/${userId}`, token, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Account deletion failed');
  }
  return res.json();
}

export async function getUserPermissions(userId, token) {
  const res = await fetchWithAuth(`/api/users/${userId}/permissions`, token, {
    method: 'GET',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to get permissions');
  }
  return res.json();
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('studyAppToken');
}

function setToken(token) {
  if (token) localStorage.setItem('studyAppToken', token);
  else localStorage.removeItem('studyAppToken');
}

export function isLoggedIn() {
  return !!getToken();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setToken(data.token);
  return data;
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Register failed');
  return data;
}

export async function logout() {
  setToken(null);
}

async function authFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function listSubjects() {
  return authFetch('/api/notes/subjects');
}

export async function downloadSubject(subject, format = 'json') {
  const data = await authFetch(`/api/notes/download/${encodeURIComponent(subject)}?format=${format}`);
  return data.cards || data;
}

export async function uploadCards(subject, cards) {
  return authFetch('/api/notes/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, cards }),
  });
}

export async function searchNotes(q) {
  return authFetch(`/api/notes/search?q=${encodeURIComponent(q)}`);
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('studyapp_token');
}

function setToken(token) {
  if (token) localStorage.setItem('studyapp_token', token);
  else localStorage.removeItem('studyapp_token');
}

function getUsername() {
  return localStorage.getItem('studyapp_username');
}

function setUsername(username) {
  if (username) localStorage.setItem('studyapp_username', username);
  else localStorage.removeItem('studyapp_username');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function register(username, password) {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  setUsername(data.user.username);
  return data;
}

export async function login(username, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  setUsername(data.user.username);
  return data;
}

export function logout() {
  setToken(null);
  setUsername(null);
}

export function isLoggedIn() {
  return !!getToken();
}

export async function getSubjects() {
  return apiFetch('/api/notes/subjects');
}

export async function downloadCards(subject) {
  const data = await apiFetch(`/api/notes/download/${encodeURIComponent(subject)}?format=json`);
  return data.cards || [];
}

export async function uploadCards(subject, cards) {
  return apiFetch('/api/notes/upload', {
    method: 'POST',
    body: JSON.stringify({ subject, cards }),
  });
}

export { getToken, getUsername };


export async function search(query) {
  if (!query || !query.trim()) return [];
  return apiFetch(`/api/notes/search?q=${encodeURIComponent(query.trim())}`);
}

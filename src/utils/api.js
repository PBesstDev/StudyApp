// Create a scoped constant for the API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get the authentication token from local storage
function getToken() {
  return localStorage.getItem('studyapp_token');
}

// Save or remove the authentication token in local storage
function setToken(token) {
  if (token) localStorage.setItem('studyapp_token', token);
  else localStorage.removeItem('studyapp_token');
}

// Get the current username from local storage
function getUsername() {
  return localStorage.getItem('studyapp_username');
}

// Save or remove the current username in local storage
function setUsername(username) {
  if (username) localStorage.setItem('studyapp_username', username);
  else localStorage.removeItem('studyapp_username');
}

// Send an API request and return the parsed JSON response
async function apiFetch(path, options = {}) {
  // Create scoped constants for the authentication token and request headers
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Send the request to the API and include the configured headers
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Throw an error when the server response is unsuccessful
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Register a new user and save their authentication data locally
export async function register(username, password) {
  // Create a scoped constant for the registration response
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  setUsername(data.user.username);
  return data;
}

// Log in a user and save their authentication data locally
export async function login(username, password) {
  // Create a scoped constant for the login response
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  setUsername(data.user.username);
  return data;
}

// Log out the current user and clear stored authentication data
export function logout() {
  setToken(null);
  setUsername(null);
}

// Return whether an authentication token is stored
export function isLoggedIn() {
  return !!getToken();
}

// Get the subjects available to the current user
export async function getSubjects() {
  return apiFetch('/api/notes/subjects');
}

// Download cards for a subject from the server
export async function downloadCards(subject) {
  // Create a scoped constant for the download response
  const data = await apiFetch(`/api/notes/download/${encodeURIComponent(subject)}?format=json`);
  return data.cards || [];
}

// Upload cards for a subject to the server
export async function uploadCards(subject, cards) {
  return apiFetch('/api/notes/upload', {
    method: 'POST',
    body: JSON.stringify({ subject, cards }),
  });
}

export { getToken, getUsername };

// Search server cards and return matching results
export async function search(query) {
  // Return early if the search query is empty
  if (!query || !query.trim()) return [];
  return apiFetch(`/api/notes/search?q=${encodeURIComponent(query.trim())}`);
}

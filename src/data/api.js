// API helper with easy BASE_URL override for development/testing.
// Priority for BASE_URL resolution (highest → lowest):
// 1. window.__NOTES_API_BASE__
// 2. localStorage['NOTES_API_BASE']
// 3. process.env.NODE_ENV === 'development' ? '/v2' : 'https://notes-api.dicoding.dev/v2'

const DEFAULT_BASE =
  process.env.NODE_ENV === 'development'
    ? '/v2'
    : 'https://notes-api.dicoding.dev/v2';

function resolveBaseUrl() {
  try {
    if (typeof window !== 'undefined') {
      if (window.__NOTES_API_BASE__) return window.__NOTES_API_BASE__;
      const fromStorage = localStorage.getItem('NOTES_API_BASE');
      if (fromStorage) return fromStorage;
    }
  } catch (_) {}
  return DEFAULT_BASE;
}

const BASE_URL = resolveBaseUrl();
const ACCESS_TOKEN_KEY = 'accessToken';

export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    window.__ACCESS_TOKEN__ = token;
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  } catch {
    return window.__ACCESS_TOKEN__ || '';
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    window.__ACCESS_TOKEN__ = '';
  }
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}

async function fetchJSON(path, { method = 'GET', headers = {}, body, auth = false, timeout = 15000 } = {}) {
  const url = `${BASE_URL}${path}`;

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  const hasBody = body !== undefined && body !== null;
  if (hasBody && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Unauthorized: no access token. Please login first.');
    }
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Network timeout: request took too long. Periksa koneksi Anda.');
    }
    throw new Error(`Network error: ${err.message || 'Gagal menghubungi server.'}`);
  } finally {
    clearTimeout(id);
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json && (json.message || json.error || (json.data && json.data.message))) ||
      `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return json && (json.data ?? json);
}

export async function register({ name, email, password }) {
  return await fetchJSON('/users', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function login({ email, password }) {
  const data = await fetchJSON('/authentications', {
    method: 'POST',
    body: { email, password },
  });
  const token = data?.accessToken;
  if (token) putAccessToken(token);
  return token;
}

export async function getUserLogged() {
  return await fetchJSON('/users/me', { auth: true });
}

export async function getNotes() {
  const d = await fetchJSON('/notes', { auth: true });
  return d?.notes ?? [];
}

export async function getArchivedNotes() {
  const d = await fetchJSON('/notes/archived', { auth: true });
  return d?.notes ?? [];
}

export async function createNote({ title, body }) {
  const d = await fetchJSON('/notes', {
    method: 'POST',
    auth: true,
    body: { title, body },
  });
  return d?.note ?? null;
}

export async function deleteNote(id) {
  if (!id) throw new Error('Note id is required');
  await fetchJSON(`/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
  return true;
}

export async function archiveNote(id) {
  if (!id) throw new Error('Note id is required');
  await fetchJSON(`/notes/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
    auth: true,
  });
  return true;
}

export async function unarchiveNote(id) {
  if (!id) throw new Error('Note id is required');
  await fetchJSON(`/notes/${encodeURIComponent(id)}/unarchive`, {
    method: 'POST',
    auth: true,
  });
  return true;
}

const api = {
  putAccessToken,
  getAccessToken,
  clearAccessToken,
  isLoggedIn,
  register,
  login,
  getUserLogged,
  getNotes,
  getArchivedNotes,
  createNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
};

export default api;
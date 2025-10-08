// src/data/api.js
// Modul API terpusat untuk Notes API v2 Dicoding
// Dokumentasi API: https://notes-api.dicoding.dev/v2

const BASE_URL = 'https://notes-api.dicoding.dev/v2';
const ACCESS_TOKEN_KEY = 'accessToken';

// ---------------------------------------------
// Token utilities
// ---------------------------------------------
export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // fallback jika localStorage tidak tersedia
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

// ---------------------------------------------
// Fetch wrapper
// ---------------------------------------------
async function fetchJSON(path, { method = 'GET', headers = {}, body, auth = false } = {}) {
  const url = `${BASE_URL}${path}`;

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  // Set JSON content-type hanya bila ada body
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

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  // Coba parse JSON; beberapa error bisa tidak mengembalikan JSON valid
  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json && (json.message || json.error || json.status)) ||
      `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  // Umumnya API mengembalikan { data: ... }
  // Kembalikan data jika ada; jika tidak ada, kembalikan json utuh.
  return json && (json.data ?? json);
}

// ---------------------------------------------
// Auth & User
// ---------------------------------------------
export async function register({ name, email, password }) {
  // POST /users
  const data = await fetchJSON('/users', {
    method: 'POST',
    body: { name, email, password },
  });
  // Biasanya mengembalikan data: { user }
  return data;
}

export async function login({ email, password }) {
  // POST /authentications
  const data = await fetchJSON('/authentications', {
    method: 'POST',
    body: { email, password },
  });
  // Biasanya mengembalikan data: { accessToken }
  const token = data?.accessToken;
  if (token) putAccessToken(token);
  return token;
}

export async function getUserLogged() {
  // GET /users/me
  const data = await fetchJSON('/users/me', { auth: true });
  // Biasanya data: { user }
  return data;
}

// ---------------------------------------------
// Notes (aktif & arsip)
// ---------------------------------------------
export async function getNotes() {
  // GET /notes
  const data = await fetchJSON('/notes', { auth: true });
  // Biasanya data: { notes: [...] }
  return data?.notes ?? [];
}

export async function getArchivedNotes() {
  // GET /notes/archived
  const data = await fetchJSON('/notes/archived', { auth: true });
  // Biasanya data: { notes: [...] }
  return data?.notes ?? [];
}

export async function createNote({ title, body }) {
  // POST /notes
  const data = await fetchJSON('/notes', {
    method: 'POST',
    auth: true,
    body: { title, body },
  });
  // Biasanya data: { note }
  return data?.note ?? null;
}

export async function deleteNote(id) {
  // DELETE /notes/{id}
  if (!id) throw new Error('Note id is required');
  await fetchJSON(`/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
  return true;
}

export async function archiveNote(id) {
  // POST /notes/{id}/archive
  if (!id) throw new Error('Note id is required');
  await fetchJSON(`/notes/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
    auth: true,
  });
  return true;
}

export async function unarchiveNote(id) {
  // POST /notes/{id}/unarchive
  if (!id) throw new Error('Note id is required');
  await fetchJSON(`/notes/${encodeURIComponent(id)}/unarchive`, {
    method: 'POST',
    auth: true,
  });
  return true;
}

// ---------------------------------------------
// Default export (opsional, jika Anda suka gaya objek)
// ---------------------------------------------
const api = {
  // token utils
  putAccessToken,
  getAccessToken,
  clearAccessToken,
  isLoggedIn,
  // auth
  register,
  login,
  getUserLogged,
  // notes
  getNotes,
  getArchivedNotes,
  createNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
};

export default api;

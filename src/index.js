import './styles/main.css';
import './components/app-bar.js';
import './components/note-form.js';
import './components/note-item.js';
import './components/note-list.js';
import './components/note-toolbar.js';
import './components/confirm-dialog.js';
import './components/toast-snackbar.js';
import './components/login-form.js';
import './components/register-form.js';
import './components/loading-indicator.js';
import {
  isLoggedIn,
  login as apiLogin,
  register as apiRegister,
  getUserLogged,
  clearAccessToken,
  getNotes,
  getArchivedNotes,
  createNote as apiCreateNote,
  deleteNote as apiDeleteNote,
  archiveNote as apiArchiveNote,
  unarchiveNote as apiUnarchiveNote
} from './data/api.js';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const THEME_KEY = 'notes-app/theme';
const PINNED_KEY = 'notes-app/pinned';

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');
const userGreetingEl = document.getElementById('user-greeting');
const loaderEl = document.querySelector('loading-indicator');

const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const switchToRegisterBtn = document.getElementById('switch-to-register');
const switchToLoginBtn = document.getElementById('switch-to-login');

const confirmEl = document.createElement('confirm-dialog');
document.body.appendChild(confirmEl);
const toastEl = document.createElement('toast-snackbar');
document.body.appendChild(toastEl);

function showAuth() {
  authContainer.hidden = false;
  appContainer.hidden = true;
  document.documentElement.setAttribute('data-appauth', 'login');
}
function showApp() {
  authContainer.hidden = true;
  appContainer.hidden = false;
  document.documentElement.setAttribute('data-appauth', 'app');
}
function showLogin() {
  showAuth();
  if (loginSection) loginSection.hidden = false;
  if (registerSection) registerSection.hidden = true;
}
function showRegister() {
  showAuth();
  if (loginSection) loginSection.hidden = true;
  if (registerSection) registerSection.hidden = false;
}
function setLoading(active, message = 'Memuat...') {
  if (!loaderEl) return;
  if (active) {
    loaderEl.setAttribute('active', '');
    loaderEl.setAttribute('message', message);
  } else {
    loaderEl.removeAttribute('active');
    loaderEl.removeAttribute('message');
  }
}
async function refreshUserGreeting() {
  try {
    if (!isLoggedIn()) {
      userGreetingEl.textContent = '';
      return;
    }
    const data = await getUserLogged();
    const name = data?.user?.name || '';
    userGreetingEl.textContent = name ? `• Masuk sebagai ${name}` : '';
  } catch {
    userGreetingEl.textContent = '';
  }
}

document.addEventListener('login-submit', async (e) => {
  const { email, password } = e.detail || {};
  if (!email || !password) {
    setLoading(false);
    await Swal.fire({ icon: 'warning', title: 'Lengkapi data', text: 'Email dan password wajib diisi.' });
    return;
  }
  setLoading(true, 'Masuk...');
  try {
    await apiLogin({ email, password });
    await refreshUserGreeting();
    showApp();
    await loadAllNotesFromAPI(true);
    toastEl.show('Berhasil masuk', { variant: 'success' });
  } catch (err) {
    setLoading(false);
    await Swal.fire({ icon: 'error', title: 'Gagal masuk', text: err?.message || 'Gagal masuk. Coba lagi.' });
  } finally {
    setLoading(false);
  }
});

document.addEventListener('register-submit', async (e) => {
  const { name, email, password } = e.detail || {};
  if (!name || !email || !password) {
    setLoading(false);
    await Swal.fire({ icon: 'warning', title: 'Lengkapi data', text: 'Nama, email, dan password wajib diisi.' });
    return;
  }
  setLoading(true, 'Membuat akun...');
  try {
    await apiRegister({ name, email, password });
    toastEl.show('Pendaftaran berhasil. Silakan masuk.', { variant: 'success' });
    showLogin();
  } catch (err) {
    setLoading(false);
    await Swal.fire({ icon: 'error', title: 'Gagal mendaftar', text: err?.message || 'Terjadi kesalahan jaringan.' });
  } finally {
    setLoading(false);
  }
});

if (switchToRegisterBtn) switchToRegisterBtn.addEventListener('click', () => showRegister());
if (switchToLoginBtn) switchToLoginBtn.addEventListener('click', () => showLogin());
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearAccessToken();
    notesActive = [];
    notesArchived = [];
    rerender(true);
    showLogin();
    userGreetingEl.textContent = '';
    toastEl.show('Anda telah keluar', { variant: 'info' });
  });
}

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function loadTheme() {
  return localStorage.getItem(THEME_KEY) || getSystemTheme();
}
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
}

function loadPinnedMap() {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
function savePinnedMap() {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedMap));
  } catch {}
}

let notesActive = [];
let notesArchived = [];
let pinnedMap = loadPinnedMap();
let filterState = 'all';
let searchQuery = '';
let themeState = loadTheme();
applyTheme(themeState);

const noteListEl = document.querySelector('note-list');
const noteFormEl = document.querySelector('note-form');
const toolbarEl = document.querySelector('note-toolbar');
toolbarEl.setAttribute('theme', themeState);

function sortForView(list) {
  return [...list].sort((a, b) => {
    const pa = pinnedMap[a.id] ? 1 : 0;
    const pb = pinnedMap[b.id] ? 1 : 0;
    if (pb !== pa) return pb - pa;
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });
}
function applyFilterAndSearch(filter, query) {
  const q = String(query || '').trim().toLowerCase();
  let base = [];
  if (filter === 'active') base = notesActive;
  else if (filter === 'archived') base = notesArchived;
  else if (filter === 'pinned') base = [...notesActive, ...notesArchived].filter((n) => pinnedMap[n.id]);
  else base = [...notesActive, ...notesArchived];
  if (q) {
    base = base.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q)
    );
  }
  return base;
}
function updateCounts() {
  const countAll = applyFilterAndSearch('all', searchQuery).length;
  const countActive = applyFilterAndSearch('active', searchQuery).length;
  const countArchived = applyFilterAndSearch('archived', searchQuery).length;
  const countPinned = applyFilterAndSearch('pinned', searchQuery).length;
  toolbarEl.setAttribute('count-all', String(countAll));
  toolbarEl.setAttribute('count-active', String(countActive));
  toolbarEl.setAttribute('count-archived', String(countArchived));
  toolbarEl.setAttribute('count-pinned', String(countPinned));
}
function getPositions() {
  const map = new Map();
  noteListEl.querySelectorAll('note-item').forEach((el) => {
    const id = el.getAttribute('note-id');
    if (!id) return;
    map.set(id, el.getBoundingClientRect());
  });
  return map;
}
function renderNotes(data) {
  noteListEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  const view = sortForView(data);
  view.forEach((n) => {
    const item = document.createElement('note-item');
    item.setAttribute('note-id', n.id);
    item.setAttribute('title', n.title ?? '');
    item.setAttribute('body', n.body ?? '');
    if (n.archived) item.setAttribute('archived', '');
    if (pinnedMap[n.id]) item.setAttribute('pinned', '');
    frag.appendChild(item);
  });
  noteListEl.appendChild(frag);
}
function playFlipAnimations(oldPositions) {
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
  noteListEl.querySelectorAll('note-item').forEach((el) => {
    const id = el.getAttribute('note-id') || '';
    const prev = oldPositions.get(id);
    const next = el.getBoundingClientRect();
    if (!prev) {
      try {
        el.animate(
          [
            { opacity: 0, transform: 'scale(0.98) translateY(8px)' },
            { opacity: 1, transform: 'none' }
          ],
          { duration: 220, easing: 'ease-out' }
        );
      } catch {}
      return;
    }
    const dx = prev.left - next.left;
    const dy = prev.top - next.top;
    if (dx !== 0 || dy !== 0) {
      try {
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' }
          ],
          { duration: 280, easing }
        );
      } catch {}
    }
  });
}
function rerender(withAnimation = true) {
  const oldPositions = withAnimation ? getPositions() : new Map();
  updateCounts();
  const filtered = applyFilterAndSearch(filterState, searchQuery);
  renderNotes(filtered);
  if (withAnimation) {
    requestAnimationFrame(() => playFlipAnimations(oldPositions));
  }
}

async function loadAllNotesFromAPI(withLoading = false) {
  if (withLoading) setLoading(true, 'Memuat catatan...');
  try {
    const [active, archived] = await Promise.all([getNotes(), getArchivedNotes()]);
    notesActive = Array.isArray(active) ? active : [];
    notesArchived = Array.isArray(archived) ? archived : [];
    rerender(true);
  } catch (err) {
    if (withLoading) setLoading(false);
    await Swal.fire({ icon: 'error', title: 'Gagal memuat catatan', text: err?.message || 'Terjadi kesalahan.' });
  } finally {
    if (withLoading) setLoading(false);
  }
}

noteFormEl.addEventListener('create', async (e) => {
  const { title, body } = e.detail;
  const t = String(title || '').trim();
  const b = String(body || '').trim();
  if (!t || !b) {
    setLoading(false);
    await Swal.fire({ icon: 'warning', title: 'Lengkapi data', text: 'Judul dan isi wajib diisi.' });
    return;
  }
  setLoading(true, 'Menambahkan catatan...');
  try {
    const note = await apiCreateNote({ title: t, body: b });
    if (note) {
      notesActive.unshift(note);
      rerender(true);
      toastEl.show('Catatan ditambahkan', { variant: 'success' });
    }
  } catch (err) {
    setLoading(false);
    await Swal.fire({ icon: 'error', title: 'Gagal menambahkan', text: err?.message || 'Terjadi kesalahan.' });
  } finally {
    setLoading(false);
  }
});

noteListEl.addEventListener('pin', (e) => {
  const { id, pinned } = e.detail;
  if (!id) return;
  if (pinned) pinnedMap[id] = true;
  else delete pinnedMap[id];
  savePinnedMap();
  rerender(true);
  toastEl.show(pinned ? 'Catatan disematkan' : 'Sematan dilepas', { variant: 'info' });
});

noteListEl.addEventListener('archive', async (e) => {
  const { id, archived } = e.detail;
  if (!id) return;
  setLoading(true, archived ? 'Mengarsipkan...' : 'Mengeluarkan dari arsip...');
  try {
    if (archived) {
      await apiArchiveNote(id);
      let idx = notesActive.findIndex((n) => n.id === id);
      if (idx !== -1) {
        const n = notesActive.splice(idx, 1)[0];
        n.archived = true;
        notesArchived.unshift(n);
      } else {
        const j = notesArchived.findIndex((n) => n.id === id);
        if (j !== -1) notesArchived[j].archived = true;
      }
      toastEl.show('Dipindahkan ke Arsip', { variant: 'info' });
    } else {
      await apiUnarchiveNote(id);
      let idx = notesArchived.findIndex((n) => n.id === id);
      if (idx !== -1) {
        const n = notesArchived.splice(idx, 1)[0];
        n.archived = false;
        notesActive.unshift(n);
      } else {
        const j = notesActive.findIndex((n) => n.id === id);
        if (j !== -1) notesActive[j].archived = false;
      }
      toastEl.show('Dikeluarkan dari Arsip', { variant: 'info' });
    }
    rerender(true);
  } catch (err) {
    setLoading(false);
    await Swal.fire({ icon: 'error', title: 'Gagal mengubah status', text: err?.message || 'Terjadi kesalahan.' });
  } finally {
    setLoading(false);
  }
});

noteListEl.addEventListener('delete', async (e) => {
  const { id } = e.detail;
  if (!id) return;
  const target = [...notesActive, ...notesArchived].find((n) => n.id === id);
  const title = (target?.title || '').trim();
  const ok = await confirmEl.openDialog({
    message: title ? `Hapus catatan “${title}”? Tindakan ini tidak bisa dibatalkan.` : 'Hapus catatan ini? Tindakan ini tidak bisa dibatalkan.',
    confirmText: 'Hapus',
    cancelText: 'Batal'
  });
  if (!ok) return;
  const el = noteListEl.querySelector(`note-item[note-id="${id}"]`);
  if (el) {
    try {
      await el
        .animate(
          [
            { opacity: 1, transform: 'none' },
            { opacity: 0, transform: 'scale(0.96) translateY(6px)' }
          ],
          { duration: 180, easing: 'ease-in' }
        )
        .finished;
    } catch {}
  }
  setLoading(true, 'Menghapus catatan...');
  try {
    await apiDeleteNote(id);
    notesActive = notesActive.filter((n) => n.id !== id);
    notesArchived = notesArchived.filter((n) => n.id !== id);
    delete pinnedMap[id];
    savePinnedMap();
    rerender(true);
    toastEl.show('Catatan dihapus', { variant: 'error', icon: '🗑️' });
  } catch (err) {
    setLoading(false);
    await Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: err?.message || 'Terjadi kesalahan.' });
  } finally {
    setLoading(false);
  }
});

toolbarEl.addEventListener('filter-change', (e) => {
  filterState = e.detail.filter;
  rerender(true);
});
toolbarEl.addEventListener('search-change', (e) => {
  searchQuery = e.detail.query || '';
  rerender(true);
});
toolbarEl.addEventListener('theme-toggle', () => {
  themeState = themeState === 'dark' ? 'light' : 'dark';
  applyTheme(themeState);
  toolbarEl.setAttribute('theme', themeState);
  toastEl.show(themeState === 'dark' ? 'Mode gelap aktif' : 'Mode terang aktif', { variant: 'info' });
});
toolbarEl.addEventListener('export-data', async () => {
  await Swal.fire({ icon: 'info', title: 'Tidak tersedia', text: 'Fitur ekspor tidak tersedia pada mode API.' });
});
toolbarEl.addEventListener('import-data', async () => {
  await Swal.fire({ icon: 'info', title: 'Tidak tersedia', text: 'Fitur impor tidak tersedia pada mode API.' });
});
toolbarEl.addEventListener('import-error', async (e) => {
  await Swal.fire({ icon: 'error', title: 'Gagal impor', text: e.detail?.message || 'Terjadi kesalahan saat membaca file.' });
});

window.addEventListener('storage', (ev) => {
  if (ev.key === THEME_KEY) {
    themeState = loadTheme();
    applyTheme(themeState);
    toolbarEl.setAttribute('theme', themeState);
  }
  if (ev.key === PINNED_KEY) {
    pinnedMap = loadPinnedMap();
    rerender(true);
  }
});

if (isLoggedIn()) {
  showApp();
  refreshUserGreeting();
  loadAllNotesFromAPI(true);
} else {
  showLogin();
}
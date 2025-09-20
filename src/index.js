import './components/app-bar.js';
import './components/note-form.js';
import './components/note-item.js';
import './components/note-list.js';
import './components/note-toolbar.js';
import './components/confirm-dialog.js';
import { notesData } from './data/notes.js';

const STORAGE_KEY = 'notes-app/v1';
const SEEDED_KEY = 'notes-app/seeded';
const THEME_KEY = 'notes-app/theme';

/* ---------- Data seeding & storage ---------- */

function seedNotesFromSample() {
  return notesData.map((n) => ({
    ...n,
    archived: n.archived ?? false,
    pinned: n.pinned ?? false,
  }));
}

function loadNotes() {
  try {
    const seeded = localStorage.getItem(SEEDED_KEY) === '1';
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!seeded) {
      const seededNotes = seedNotesFromSample();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seededNotes));
      localStorage.setItem(SEEDED_KEY, '1');
      return seededNotes;
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const seededNotes = seedNotesFromSample();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seededNotes));
    localStorage.setItem(SEEDED_KEY, '1');
    return seededNotes;
  }
}

function saveNotes(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage:', e);
  }
}

/* ---------- Theme management ---------- */

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

/* ---------- State ---------- */

let notes = loadNotes();
let filterState = 'all';   // all | active | archived | pinned
let searchQuery = '';
let themeState = loadTheme();
applyTheme(themeState);

/* ---------- Elements ---------- */

const noteListEl = document.querySelector('note-list');
const noteFormEl = document.querySelector('note-form');
const toolbarEl = document.querySelector('note-toolbar');
toolbarEl.setAttribute('theme', themeState);

// Create a single confirm dialog instance
const confirmEl = document.createElement('confirm-dialog');
document.body.appendChild(confirmEl);

/* ---------- Utils ---------- */

function sortForView(list) {
  return [...list].sort((a, b) => {
    const pa = a.pinned === true ? 1 : 0;
    const pb = b.pinned === true ? 1 : 0;
    if (pb !== pa) return pb - pa; // pinned duluan
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta; // terbaru duluan
  });
}

function applyFilterAndSearch(list, filter, query) {
  const q = String(query || '').trim().toLowerCase();
  let out = list.filter((n) => {
    if (filter === 'active') return !n.archived;
    if (filter === 'archived') return n.archived;
    if (filter === 'pinned') return n.pinned === true;
    return true; // all
  });
  if (q) {
    out = out.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q)
    );
  }
  return out;
}

function updateCounts() {
  const countAll = applyFilterAndSearch(notes, 'all', searchQuery).length;
  const countActive = applyFilterAndSearch(notes, 'active', searchQuery).length;
  const countArchived = applyFilterAndSearch(notes, 'archived', searchQuery).length;
  const countPinned = applyFilterAndSearch(notes, 'pinned', searchQuery).length;

  toolbarEl.setAttribute('count-all', String(countAll));
  toolbarEl.setAttribute('count-active', String(countActive));
  toolbarEl.setAttribute('count-archived', String(countArchived));
  toolbarEl.setAttribute('count-pinned', String(countPinned));
}

/* ---------- Render ---------- */

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
    if (n.pinned) item.setAttribute('pinned', '');
    frag.appendChild(item);
  });
  noteListEl.appendChild(frag);
}

function rerender() {
  updateCounts();
  const filtered = applyFilterAndSearch(notes, filterState, searchQuery);
  renderNotes(filtered);
}

/* ---------- Events ---------- */

// note-form: create
noteFormEl.addEventListener('create', (e) => {
  const { title, body } = e.detail;
  const newNote = {
    id: `notes-${Date.now()}`,
    title: String(title || '').trim(),
    body: String(body || '').trim(),
    createdAt: new Date().toISOString(),
    archived: false,
    pinned: false,
  };
  notes.unshift(newNote);
  saveNotes(notes);
  rerender();
});

// note-item: pin/unpin
noteListEl.addEventListener('pin', async (e) => {
  const { id, pinned } = e.detail;
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.pinned = pinned;
    saveNotes(notes);
    rerender();
  }
});

// note-item: archive/unarchive
noteListEl.addEventListener('archive', (e) => {
  const { id, archived } = e.detail;
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.archived = archived;
    saveNotes(notes);
    rerender();
  }
});

// note-item: delete with custom confirm dialog
noteListEl.addEventListener('delete', async (e) => {
  const { id } = e.detail;
  const target = notes.find((n) => n.id === id);
  const title = (target?.title || '').trim();
  const ok = await confirmEl.openDialog({
    message: title ? `Hapus catatan “${title}”? Tindakan ini tidak bisa dibatalkan.` : 'Hapus catatan ini? Tindakan ini tidak bisa dibatalkan.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  });
  if (!ok) return;
  notes = notes.filter((n) => n.id !== id);
  saveNotes(notes);
  rerender();
});

// toolbar: filter, search, theme toggle
toolbarEl.addEventListener('filter-change', (e) => {
  filterState = e.detail.filter;
  rerender();
});
toolbarEl.addEventListener('search-change', (e) => {
  searchQuery = e.detail.query || '';
  rerender();
});
toolbarEl.addEventListener('theme-toggle', () => {
  themeState = themeState === 'dark' ? 'light' : 'dark';
  applyTheme(themeState);
  toolbarEl.setAttribute('theme', themeState);
});

// sync antar tab
window.addEventListener('storage', (ev) => {
  if (ev.key === STORAGE_KEY) {
    notes = loadNotes();
    rerender();
  }
  if (ev.key === THEME_KEY) {
    themeState = loadTheme();
    applyTheme(themeState);
    toolbarEl.setAttribute('theme', themeState);
  }
});

// initial render
rerender();
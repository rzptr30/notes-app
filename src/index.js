import './components/app-bar.js';
import './components/note-form.js';
import './components/note-item.js';
import './components/note-list.js';
import './components/note-toolbar.js';
import { notesData } from './data/notes.js';

const STORAGE_KEY = 'notes-app/v1';

// Muat notes dari localStorage; fallback ke data sample
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...notesData];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...notesData];
  } catch {
    return [...notesData];
  }
}

// Simpan notes ke localStorage
function saveNotes(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage:', e);
  }
}

// State
let notes = loadNotes();
let filterState = 'all';   // all | active | archived | pinned
let searchQuery = '';

// Elemen
const noteListEl = document.querySelector('note-list');
const noteFormEl = document.querySelector('note-form');
const toolbarEl = document.querySelector('note-toolbar');

// Util: urut tampilan — disematkan dulu, lalu terbaru
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

// Util: filter + cari
function applyFilterAndSearch(list, filter, query) {
  const q = String(query || '').trim().toLowerCase();
  let out = list.filter((n) => {
    if (filter === 'active') return !n.archived;
    if (filter === 'archived') return n.archived;
    if (filter === 'pinned') return n.pinned === true;
    return true; // all
  });
  if (q) {
    out = out.filter((n) =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.body || '').toLowerCase().includes(q)
    );
  }
  return out;
}

// Render daftar catatan ke DOM
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

// Re-render menerapkan filter + cari
function rerender() {
  const filtered = applyFilterAndSearch(notes, filterState, searchQuery);
  renderNotes(filtered);
}

// Event: tambah catatan dari <note-form>
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

// Event: sematkan / lepas sematan dari <note-item>
noteListEl.addEventListener('pin', (e) => {
  const { id, pinned } = e.detail;
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.pinned = pinned;
    saveNotes(notes);
    rerender();
  }
});

// Event: arsip / unarsip dari <note-item>
noteListEl.addEventListener('archive', (e) => {
  const { id, archived } = e.detail;
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.archived = archived;
    saveNotes(notes);
    rerender();
  }
});

// Event: hapus dari <note-item>
noteListEl.addEventListener('delete', (e) => {
  const { id } = e.detail;
  notes = notes.filter((n) => n.id !== id);
  saveNotes(notes);
  rerender();
});

// Event: toolbar (filter + cari)
toolbarEl.addEventListener('filter-change', (e) => {
  filterState = e.detail.filter; // 'all' | 'active' | 'archived' | 'pinned'
  rerender();
});
toolbarEl.addEventListener('search-change', (e) => {
  searchQuery = e.detail.query || '';
  rerender();
});

// Sinkronisasi antar tab (opsional)
window.addEventListener('storage', (ev) => {
  if (ev.key === STORAGE_KEY) {
    notes = loadNotes();
    rerender();
  }
});

// Tampilkan data awal
rerender();
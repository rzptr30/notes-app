import './styles/main.css';

import './components/app-bar.js';
import './components/note-form.js';
import './components/note-item.js';
import './components/note-list.js';
import './components/note-toolbar.js';
import './components/confirm-dialog.js';
import './components/toast-snackbar.js';
import { notesData } from './data/notes.js';

const STORAGE_KEY = 'notes-app/v1';
const SEEDED_KEY = 'notes-app/seeded';
const THEME_KEY = 'notes-app/theme';


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


let notes = loadNotes();
let filterState = 'all';   
let searchQuery = '';
let themeState = loadTheme();
applyTheme(themeState);


const noteListEl = document.querySelector('note-list');
const noteFormEl = document.querySelector('note-form');
const toolbarEl = document.querySelector('note-toolbar');
toolbarEl.setAttribute('theme', themeState);

const confirmEl = document.createElement('confirm-dialog');
document.body.appendChild(confirmEl);

const toastEl = document.createElement('toast-snackbar');
document.body.appendChild(toastEl);


function sortForView(list) {
  return [...list].sort((a, b) => {
    const pa = a.pinned === true ? 1 : 0;
    const pb = b.pinned === true ? 1 : 0;
    if (pb !== pa) return pb - pa; 
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta; 
  });
}

function applyFilterAndSearch(list, filter, query) {
  const q = String(query || '').trim().toLowerCase();
  let out = list.filter((n) => {
    if (filter === 'active') return !n.archived;
    if (filter === 'archived') return n.archived;
    if (filter === 'pinned') return n.pinned === true;
    return true;
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
    if (n.pinned) item.setAttribute('pinned', '');
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
      el.animate(
        [
          { opacity: 0, transform: 'scale(0.98) translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 220, easing: 'ease-out' }
      );
      return;
    }

    const dx = prev.left - next.left;
    const dy = prev.top - next.top;

    if (dx !== 0 || dy !== 0) {
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 280, easing }
      );
    }
  });
}

function rerender(withAnimation = true) {
  const oldPositions = withAnimation ? getPositions() : new Map();
  updateCounts();
  const filtered = applyFilterAndSearch(notes, filterState, searchQuery);
  renderNotes(filtered);
  if (withAnimation) {
    requestAnimationFrame(() => playFlipAnimations(oldPositions));
  }
}


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
  rerender(true);
  toastEl.show('Catatan ditambahkan', { variant: 'success' });
});

noteListEl.addEventListener('pin', (e) => {
  const { id, pinned } = e.detail;
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.pinned = pinned;
    saveNotes(notes);
    rerender(true);
    toastEl.show(pinned ? 'Catatan disematkan' : 'Sematan dilepas', { variant: 'info' });
  }
});

noteListEl.addEventListener('archive', (e) => {
  const { id, archived } = e.detail;
  const target = notes.find((n) => n.id === id);
  if (target) {
    target.archived = archived;
    saveNotes(notes);
    rerender(true);
    toastEl.show(archived ? 'Dipindahkan ke Arsip' : 'Dikeluarkan dari Arsip', { variant: 'info' });
  }
});

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

  const el = noteListEl.querySelector(`note-item[note-id="${id}"]`);
  if (el) {
    try {
      await el
        .animate(
          [
            { opacity: 1, transform: 'none' },
            { opacity: 0, transform: 'scale(0.96) translateY(6px)' },
          ],
          { duration: 180, easing: 'ease-in' }
        )
        .finished;
    } catch {}
  }

  notes = notes.filter((n) => n.id !== id);
  saveNotes(notes);
  rerender(true);
  toastEl.show('Catatan dihapus', { variant: 'error', icon: '🗑️' });
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

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function exportNotes() {
  const payload = { app: 'notes-app', version: 1, exportedAt: new Date().toISOString(), notes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `notes-export-${nowStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
  toastEl.show('Export JSON dimulai', { variant: 'info' });
}
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['true', '1', 'yes', 'y'].includes(v.trim().toLowerCase());
  if (typeof v === 'number') return v !== 0;
  return false;
}
function sanitizeImportedNotes(input) {
  let arr = null;
  if (Array.isArray(input)) arr = input;
  else if (input && typeof input === 'object' && Array.isArray(input.notes)) arr = input.notes;
  if (!Array.isArray(arr)) throw new Error('Format JSON tidak valid. Gunakan array catatan atau objek { notes: [...] }.');

  const result = arr.map((n, idx) => {
    const id = (n && n.id != null) ? String(n.id) : '';
    const createdAtRaw = n?.createdAt;
    const created = createdAtRaw ? new Date(createdAtRaw) : new Date();
    const createdAt = isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString();
    return {
      id: id.trim() || `notes-${Date.now()}-${idx}`,
      title: String(n?.title ?? '').trim(),
      body: String(n?.body ?? ''),
      createdAt,
      archived: toBool(n?.archived),
      pinned: toBool(n?.pinned),
    };
  });

  const seen = new Set();
  for (let i = 0; i < result.length; i++) {
    let id = result[i].id;
    if (!id || seen.has(id)) {
      let suffix = 1;
      while (seen.has(`${id || 'notes'}-${suffix}`)) suffix++;
      id = `${id || 'notes'}-${suffix}`;
      result[i].id = id;
    }
    seen.add(id);
  }
  return result;
}

toolbarEl.addEventListener('export-data', () => {
  exportNotes();
});
toolbarEl.addEventListener('import-data', async (e) => {
  const text = e.detail?.text || '';
  const filename = e.detail?.filename || 'file.json';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    alert('File JSON tidak valid. Pastikan formatnya benar.');
    return;
  }
  let newNotes;
  try {
    newNotes = sanitizeImportedNotes(parsed);
  } catch (err) {
    alert(err.message || 'Struktur data tidak sesuai.');
    return;
  }
  const ok = await confirmEl.openDialog({
    message: `Impor dari “${filename}” akan menggantikan ${notes.length} catatan saat ini dengan ${newNotes.length} catatan baru. Lanjutkan?`,
    confirmText: 'Impor',
    cancelText: 'Batal',
  });
  if (!ok) return;

  notes = newNotes;
  localStorage.setItem(SEEDED_KEY, '1');
  saveNotes(notes);
  rerender(true);
  toastEl.show('Impor data berhasil', { variant: 'success' });
});
toolbarEl.addEventListener('import-error', (e) => {
  alert(e.detail?.message || 'Terjadi kesalahan saat membaca file.');
});

window.addEventListener('storage', (ev) => {
  if (ev.key === STORAGE_KEY) {
    notes = loadNotes();
    rerender(true);
  }
  if (ev.key === THEME_KEY) {
    themeState = loadTheme();
    applyTheme(themeState);
    toolbarEl.setAttribute('theme', themeState);
  }
});

rerender(false);
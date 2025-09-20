import './components/app-bar.js';
import './components/note-form.js';
import './components/note-item.js';
import './components/note-list.js';
import { notesData } from './data/notes.js';

// State awal dari sample
let notes = [...notesData];

const noteListEl = document.querySelector('note-list');
const noteFormEl = document.querySelector('note-form');

// Render daftar catatan ke DOM
function renderNotes(data) {
  noteListEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  data.forEach((n, idx) => {
    const item = document.createElement('note-item');
    item.setAttribute('note-id', n.id);
    item.setAttribute('title', n.title ?? '');
    item.setAttribute('body', n.body ?? '');
    if (n.archived) item.setAttribute('archived', '');
    if (idx === 0) item.setAttribute('pinned', ''); // contoh custom attribute
    frag.appendChild(item);
  });
  noteListEl.appendChild(frag);
}

// Event: tambah catatan dari <note-form>
noteFormEl.addEventListener('create', (e) => {
  const { title, body } = e.detail;
  const newNote = {
    id: `notes-${Date.now()}`,
    title: title.trim(),
    body: body.trim(),
    createdAt: new Date().toISOString(),
    archived: false,
  };
  notes.unshift(newNote);
  renderNotes(notes);
});

// Event: arsip / unarsip dari <note-item>
noteListEl.addEventListener('archive', (e) => {
  const { id, archived } = e.detail;
  const target = notes.find(n => n.id === id);
  if (target) {
    target.archived = archived;
    renderNotes(notes);
  }
});

// Event: hapus dari <note-item>
noteListEl.addEventListener('delete', (e) => {
  const { id } = e.detail;
  notes = notes.filter(n => n.id !== id);
  renderNotes(notes);
});

// Tampilkan data awal
renderNotes(notes);
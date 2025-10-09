/**
 * mock-api.js
 * Simple Express mock server implementing endpoints used by the Notes App:
 * - POST /v2/users           -> register
 * - POST /v2/authentications -> login (returns accessToken)
 * - GET  /v2/users/me        -> info user (requires Authorization)
 * - GET  /v2/notes
 * - GET  /v2/notes/archived
 * - POST /v2/notes           -> create
 * - DELETE /v2/notes/:id
 * - POST /v2/notes/:id/archive
 * - POST /v2/notes/:id/unarchive
 *
 * Usage: node mock-api.js
 */
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MOCK_API_PORT || 3001;

// Simple in-memory stores
const users = new Map(); // id -> { id, name, email, password }
const tokens = new Map(); // token -> userId
let notes = []; // { id, title, body, createdAt, archived }
let archivedNotes = [];

// Helper to create demo user (optional)
const demoUserId = uuidv4();
users.set(demoUserId, {
  id: demoUserId,
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'password'
});

function makeResponseSuccess(data = {}) {
  return { status: 'success', data };
}
function makeResponseFail(message = 'Not Found') {
  return { status: 'fail', message };
}

// Register
app.post('/v2/users', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json(makeResponseFail('Missing name/email/password'));
  }
  // check unique email
  for (const u of users.values()) {
    if (u.email === email) {
      return res.status(400).json(makeResponseFail('Email already registered'));
    }
  }
  const id = uuidv4();
  users.set(id, { id, name, email, password });
  return res.status(201).json(makeResponseSuccess({ userId: id }));
});

// Login -> return access token
app.post('/v2/authentications', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json(makeResponseFail('Missing credentials'));
  const user = [...users.values()].find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json(makeResponseFail('Invalid credentials'));
  const token = 'mock-' + uuidv4();
  tokens.set(token, user.id);
  return res.status(201).json(makeResponseSuccess({ accessToken: token }));
});

// Get logged user
app.get('/v2/users/me', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  const user = users.get(userId);
  return res.json(makeResponseSuccess({ user: { id: user.id, name: user.name, email: user.email } }));
});

// Get notes
app.get('/v2/notes', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  // return active notes
  return res.json(makeResponseSuccess({ notes }));
});

// Get archived notes
app.get('/v2/notes/archived', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  return res.json(makeResponseSuccess({ notes: archivedNotes }));
});

// Create note
app.post('/v2/notes', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json(makeResponseFail('Missing title or body'));
  const note = { id: uuidv4(), title, body, createdAt: new Date().toISOString(), archived: false };
  notes.unshift(note);
  return res.status(201).json(makeResponseSuccess({ note }));
});

// Delete note
app.delete('/v2/notes/:id', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  const { id } = req.params;
  const prevLen = notes.length + archivedNotes.length;
  notes = notes.filter((n) => n.id !== id);
  archivedNotes = archivedNotes.filter((n) => n.id !== id);
  if (notes.length + archivedNotes.length === prevLen) {
    // nothing removed -> still return 200 to simplify, but can return 404
    return res.status(200).json(makeResponseSuccess({}));
  }
  return res.status(200).json(makeResponseSuccess({}));
});

// Archive
app.post('/v2/notes/:id/archive', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  const { id } = req.params;
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return res.status(404).json(makeResponseFail('Note not found'));
  const n = notes.splice(idx, 1)[0];
  n.archived = true;
  archivedNotes.unshift(n);
  return res.status(200).json(makeResponseSuccess({}));
});

// Unarchive
app.post('/v2/notes/:id/unarchive', (req, res) => {
  const auth = req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return res.status(401).json(makeResponseFail('Unauthorized'));
  const { id } = req.params;
  const idx = archivedNotes.findIndex((n) => n.id === id);
  if (idx === -1) return res.status(404).json(makeResponseFail('Note not found'));
  const n = archivedNotes.splice(idx, 1)[0];
  n.archived = false;
  notes.unshift(n);
  return res.status(200).json(makeResponseSuccess({}));
});

app.listen(PORT, () => {
  console.log(`Mock Notes API running at http://localhost:${PORT}/v2`);
  console.log('Endpoints: POST /v2/users, POST /v2/authentications, GET /v2/notes, etc.');
});
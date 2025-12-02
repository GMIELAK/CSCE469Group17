const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

app.use('/public', express.static(path.join(__dirname, 'public')));

function isLoggedIn(req) {
  return !!req.session.userId;
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/', (req, res) => {
  if (isLoggedIn(req)) return res.redirect('/app');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/app', (req, res) => {
  if (!isLoggedIn(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Auth APIs
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    if (String(username).length < 3) return res.status(400).json({ error: 'Username too short' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password too short' });

    const existing = await db.getUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.createUser(username, hash);
    // Auto-login after signup
    req.session.userId = result.id;
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await db.getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = user._id;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Credentials APIs
app.get('/api/credentials', requireAuth, async (req, res) => {
  try {
    const rows = await db.listCredentials(req.session.userId);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/credentials', requireAuth, async (req, res) => {
  try {
    const { site, username, password, notes = '' } = req.body;
    if (!site || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    const result = await db.createCredential(req.session.userId, { site, username, password, notes });
    res.status(201).json({ id: result.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/credentials/:id', requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { site, username, password, notes = '' } = req.body;
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    if (!site || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    const exists = await db.getCredentialById(id, req.session.userId);
    if (!exists) return res.status(404).json({ error: 'Not found' });
    await db.updateCredential(req.session.userId, id, { site, username, password, notes });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/credentials/:id', requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const exists = await db.getCredentialById(id, req.session.userId);
    if (!exists) return res.status(404).json({ error: 'Not found' });
    await db.deleteCredential(req.session.userId, id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
});



import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import sqlite3pkg from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';

const app = express();
const sqlite3 = sqlite3pkg.verbose();
const db = new sqlite3.Database('./db.sqlite');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'password-manager-secret',
  resave: false,
  saveUninitialized: false
}));

// DB setup
// Users: id, username, password_hash
// Credentials: id, user_id, site, username, password, notes

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    site TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

// Auth routes
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function(err) {
      if (err) return res.status(400).json({ error: 'Username taken' });
      req.session.userId = this.lastID;
      res.json({ success: true });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, user.password_hash, (err, result) => {
      if (result) {
        req.session.userId = user.id;
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid credentials' });
      }
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Credentials CRUD
app.get('/api/credentials', requireLogin, (req, res) => {
  db.all('SELECT * FROM credentials WHERE user_id = ?', [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/credentials', requireLogin, (req, res) => {
  const { site, username, password, notes } = req.body;
  if (!site || !username || !password) return res.status(400).json({ error: 'Missing fields' });
  db.run('INSERT INTO credentials (user_id, site, username, password, notes) VALUES (?, ?, ?, ?, ?)',
    [req.session.userId, site, username, password, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ id: this.lastID });
    });
});

app.put('/api/credentials/:id', requireLogin, (req, res) => {
  const { site, username, password, notes } = req.body;
  db.run('UPDATE credentials SET site=?, username=?, password=?, notes=? WHERE id=? AND user_id=?',
    [site, username, password, notes || '', req.params.id, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ success: true });
    });
});

app.delete('/api/credentials/:id', requireLogin, (req, res) => {
  db.run('DELETE FROM credentials WHERE id=? AND user_id=?', [req.params.id, req.session.userId], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ success: true });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  db.get('SELECT username FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, username: user.username });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

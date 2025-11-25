const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Database setup
const db = new sqlite3.Database('./password_manager.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      site TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

// Helper function to check authentication
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

// ==================== AUTH ROUTES ====================

// Sign up
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hashedPassword],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.json({ success: true });
    }
  );
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({ success: true });
    }
  );
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Check auth status
app.get('/api/status', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// ==================== CREDENTIAL ROUTES ====================

// Get all credentials for logged-in user
app.get('/api/credentials', requireLogin, (req, res) => {
  db.all(
    `SELECT id, site, username, password, notes FROM credentials WHERE user_id = ? ORDER BY site ASC`,
    [req.session.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Add new credential
app.post('/api/credentials', requireLogin, (req, res) => {
  const { site, username, password, notes } = req.body;

  if (!site || !username || !password) {
    return res.status(400).json({ error: 'Site, username, and password required' });
  }

  db.run(
    `INSERT INTO credentials (user_id, site, username, password, notes) VALUES (?, ?, ?, ?, ?)`,
    [req.session.userId, site, username, password, notes || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID });
    }
  );
});

// Update credential
app.put('/api/credentials/:id', requireLogin, (req, res) => {
  const { site, username, password, notes } = req.body;
  const credId = req.params.id;

  if (!site || !username || !password) {
    return res.status(400).json({ error: 'Site, username, and password required' });
  }

  db.run(
    `UPDATE credentials SET site = ?, username = ?, password = ?, notes = ? WHERE id = ? AND user_id = ?`,
    [site, username, password, notes || '', credId, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      res.json({ success: true });
    }
  );
});

// Delete credential
app.delete('/api/credentials/:id', requireLogin, (req, res) => {
  const credId = req.params.id;

  db.run(
    `DELETE FROM credentials WHERE id = ? AND user_id = ?`,
    [credId, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      res.json({ success: true });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Password Manager running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Database connection closed');
    process.exit(0);
  });
});

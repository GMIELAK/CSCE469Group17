const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'password-manager-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'password_manager.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDB();
  }
});

// Initialize database schema
function initializeDB() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table ready');
  });

  // Create credentials table
  db.run(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      site TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating credentials table:', err);
    else console.log('Credentials table ready');
  });
}

// Middleware to check authentication
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// ============== AUTH ROUTES ==============

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        req.session.userId = this.lastID;
        req.session.username = username;
        res.json({ success: true, message: 'Signup successful' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error during signup' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT id, username, password FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({ success: true, message: 'Login successful', username: user.username });
    } catch (error) {
      res.status(500).json({ error: 'Error during login' });
    }
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Get current user
app.get('/api/auth/user', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  res.json({ user: { id: req.session.userId, username: req.session.username } });
});

// ============== CREDENTIAL ROUTES ==============

// Get all credentials for logged-in user
app.get('/api/credentials', requireLogin, (req, res) => {
  db.all(
    'SELECT id, site, username, notes, created_at, updated_at FROM credentials WHERE user_id = ? ORDER BY updated_at DESC',
    [req.session.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get specific credential (for viewing password)
app.get('/api/credentials/:id', requireLogin, (req, res) => {
  db.get(
    'SELECT * FROM credentials WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      res.json(row);
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
    'INSERT INTO credentials (user_id, site, username, password, notes) VALUES (?, ?, ?, ?, ?)',
    [req.session.userId, site, username, password, notes || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, site, username, notes });
    }
  );
});

// Update credential
app.put('/api/credentials/:id', requireLogin, (req, res) => {
  const { site, username, password, notes } = req.body;

  if (!site || !username || !password) {
    return res.status(400).json({ error: 'Site, username, and password required' });
  }

  db.run(
    'UPDATE credentials SET site = ?, username = ?, password = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [site, username, password, notes || '', req.params.id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      res.json({ success: true, message: 'Credential updated' });
    }
  );
});

// Delete credential
app.delete('/api/credentials/:id', requireLogin, (req, res) => {
  db.run(
    'DELETE FROM credentials WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Credential not found' });
      }
      res.json({ success: true, message: 'Credential deleted' });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Password Manager server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({
  secret: 'simple-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));

const usersFile = path.join(__dirname, 'data', 'users.json');

function readUsers() {
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    username,
    password: hashedPassword,
    credentials: []
  };
  users.push(newUser);
  writeUsers(users);
  req.session.userId = newUser.id;
  res.redirect('/dashboard');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  req.session.userId = user.id;
  res.redirect('/dashboard');
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/credentials', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const users = readUsers();
  const user = users.find(u => u.id === req.session.userId);
  res.json(user.credentials);
});

app.post('/api/credentials', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { site, username, password, notes } = req.body;
  const users = readUsers();
  const user = users.find(u => u.id === req.session.userId);
  const newCredential = {
    id: Date.now().toString(),
    site,
    username,
    password,
    notes: notes || ''
  };
  user.credentials.push(newCredential);
  writeUsers(users);
  res.json(newCredential);
});

app.put('/api/credentials/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const { site, username, password, notes } = req.body;
  const users = readUsers();
  const user = users.find(u => u.id === req.session.userId);
  const credential = user.credentials.find(c => c.id === id);
  if (!credential) {
    return res.status(404).json({ error: 'Credential not found' });
  }
  credential.site = site;
  credential.username = username;
  credential.password = password;
  credential.notes = notes || '';
  writeUsers(users);
  res.json(credential);
});

app.delete('/api/credentials/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  const users = readUsers();
  const user = users.find(u => u.id === req.session.userId);
  user.credentials = user.credentials.filter(c => c.id !== id);
  writeUsers(users);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
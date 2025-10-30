import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/health', async (req, res) => {
  try {
    // quick sanity check that DB is readable
    await db.listUsers();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Basic CRUD for users (development only)
app.get('/users', async (req, res) => {
  const users = await db.listUsers();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  const existing = await db.findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'user already exists' });
  // NOTE: password hashing should be implemented by generated auth code
  const user = await db.createUser({ email, name, passwordHash: password ?? null });
  res.status(201).json(user);
});

app.get('/users/:id', async (req, res) => {
  const user = await db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

app.put('/users/:id', async (req, res) => {
  const updated = await db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

app.delete('/users/:id', async (req, res) => {
  const ok = await db.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
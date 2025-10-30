import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

type User = {
  id: string;
  email: string;
  name?: string;
  passwordHash?: string | null;
  createdAt: string;
};

type Vault = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

type Entry = {
  id: string;
  vaultId: string;
  data: any;
  createdAt: string;
};

type DBShape = {
  users: User[];
  vaults: Vault[];
  entries: Entry[];
};

// Keep the JSON file under the backend folder. Using process.cwd() ensures this works
// whether running from project root or from dist when compiled.
const DB_FILE = path.join(process.cwd(), 'local-vault', 'backend', 'data.json');

const DEFAULT_DB: DBShape = { users: [], vaults: [], entries: [] };

async function readDB(): Promise<DBShape> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DBShape;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await ensureDirAndWrite(DEFAULT_DB);
      return DEFAULT_DB;
    }
    throw err;
  }
}

async function ensureDirAndWrite(db: DBShape) {
  // Ensure folder exists
  const dir = path.dirname(DB_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

async function writeDB(db: DBShape) {
  await ensureDirAndWrite(db);
}

async function list<T extends keyof DBShape>(collection: T) {
  const db = await readDB();
  return db[collection] as DBShape[T];
}

async function getById<T extends keyof DBShape>(collection: T, id: string) {
  const items = await list(collection);
  // @ts-ignore
  return (items as any[]).find((i) => i.id === id) ?? null;
}

async function create<T extends keyof DBShape>(collection: T, item: any) {
  const db = await readDB();
  const col = db[collection] as any[];
  const now = new Date().toISOString();
  const record = { id: randomUUID(), createdAt: now, ...item };
  col.push(record);
  await writeDB(db);
  return record;
}

async function update<T extends keyof DBShape>(collection: T, id: string, patch: any) {
  const db = await readDB();
  const col = db[collection] as any[];
  const idx = col.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  col[idx] = { ...col[idx], ...patch };
  await writeDB(db);
  return col[idx];
}

async function remove<T extends keyof DBShape>(collection: T, id: string) {
  const db = await readDB();
  const col = db[collection] as any[];
  const idx = col.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  col.splice(idx, 1);
  await writeDB(db);
  return true;
}

// User-specific helpers
async function listUsers() {
  return list('users');
}

async function getUserById(id: string) {
  return getById('users', id);
}

async function findUserByEmail(email: string) {
  const users = await list('users');
  return (users as User[]).find((u) => u.email === email) ?? null;
}

async function createUser(payload: Partial<User>) {
  const toCreate = {
    email: payload.email,
    name: payload.name,
    passwordHash: payload.passwordHash ?? null,
  } as any;
  return create('users', toCreate) as Promise<User>;
}

async function updateUser(id: string, patch: Partial<User>) {
  return update('users', id, patch);
}

async function deleteUser(id: string) {
  return remove('users', id);
}

export default {
  // generic
  list,
  getById,
  create,
  update,
  remove,
  // users
  listUsers,
  getUserById,
  findUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};

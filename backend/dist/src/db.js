import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
// Keep the JSON file under the backend folder. Using process.cwd() ensures this works
// whether running from project root or from dist when compiled.
const DB_FILE = path.join(process.cwd(), 'local-vault', 'backend', 'data.json');
const DEFAULT_DB = { users: [], vaults: [], entries: [] };
async function readDB() {
    try {
        const raw = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(raw);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            await ensureDirAndWrite(DEFAULT_DB);
            return DEFAULT_DB;
        }
        throw err;
    }
}
async function ensureDirAndWrite(db) {
    // Ensure folder exists
    const dir = path.dirname(DB_FILE);
    try {
        await fs.mkdir(dir, { recursive: true });
    }
    catch { }
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}
async function writeDB(db) {
    await ensureDirAndWrite(db);
}
async function list(collection) {
    const db = await readDB();
    return db[collection];
}
async function getById(collection, id) {
    const items = await list(collection);
    // @ts-ignore
    return items.find((i) => i.id === id) ?? null;
}
async function create(collection, item) {
    const db = await readDB();
    const col = db[collection];
    const now = new Date().toISOString();
    const record = { id: randomUUID(), createdAt: now, ...item };
    col.push(record);
    await writeDB(db);
    return record;
}
async function update(collection, id, patch) {
    const db = await readDB();
    const col = db[collection];
    const idx = col.findIndex((i) => i.id === id);
    if (idx === -1)
        return null;
    col[idx] = { ...col[idx], ...patch };
    await writeDB(db);
    return col[idx];
}
async function remove(collection, id) {
    const db = await readDB();
    const col = db[collection];
    const idx = col.findIndex((i) => i.id === id);
    if (idx === -1)
        return false;
    col.splice(idx, 1);
    await writeDB(db);
    return true;
}
// User-specific helpers
async function listUsers() {
    return list('users');
}
async function getUserById(id) {
    return getById('users', id);
}
async function findUserByEmail(email) {
    const users = await list('users');
    return users.find((u) => u.email === email) ?? null;
}
async function createUser(payload) {
    const toCreate = {
        email: payload.email,
        name: payload.name,
        passwordHash: payload.passwordHash ?? null,
    };
    return create('users', toCreate);
}
async function updateUser(id, patch) {
    return update('users', id, patch);
}
async function deleteUser(id) {
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
//# sourceMappingURL=db.js.map
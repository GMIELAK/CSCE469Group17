const fs = require('fs');
const path = require('path');
const Datastore = require('nedb-promises');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const users = Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true });
const credentials = Datastore.create({ filename: path.join(dataDir, 'credentials.db'), autoload: true });

users.ensureIndex({ fieldName: 'username', unique: true });
credentials.ensureIndex({ fieldName: 'user_id' });

module.exports = {
  async createUser(username, passwordHash) {
    const doc = await users.insert({ username, password_hash: passwordHash, created_at: new Date().toISOString() });
    return { id: doc._id };
  },
  async getUserByUsername(username) {
    return users.findOne({ username });
  },
  async getUserById(id) {
    return users.findOne({ _id: id });
  },
  async listCredentials(userId) {
    return credentials.find({ user_id: userId }).sort({ _id: -1 });
  },
  async getCredentialById(id, userId) {
    return credentials.findOne({ _id: id, user_id: userId });
  },
  async createCredential(userId, { site, username, password, notes = '' }) {
    const doc = await credentials.insert({ user_id: userId, site, username, password, notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return { id: doc._id };
  },
  async updateCredential(userId, id, { site, username, password, notes = '' }) {
    return credentials.update({ _id: id, user_id: userId }, { $set: { site, username, password, notes, updated_at: new Date().toISOString() } }, { multi: false });
  },
  async deleteCredential(userId, id) {
    return credentials.remove({ _id: id, user_id: userId }, { multi: false });
  },
};

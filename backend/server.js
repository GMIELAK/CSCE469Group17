const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

const JWT_SECRET = 'your_jwt_secret'; // In a real app, use an environment variable

let users = [];
let credentials = {};

try {
    users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
} catch (error) {
    console.error("Error reading data files:", error);
}

const saveData = () => {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    fs.writeFileSync('credentials.json', JSON.stringify(credentials, null, 2));
};

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Password Manager Backend');
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// User signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).send('User already exists');
    }
    const newUser = { id: Date.now().toString(), username, password }; // In a real app, hash the password
    users.push(newUser);
    credentials[newUser.id] = [];
    saveData();
    res.status(201).send('User created');
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password); // In a real app, compare hashed passwords
    if (!user) {
        return res.status(400).send('Invalid credentials');
    }
    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ accessToken });
});

// Get credentials
app.get('/credentials', authenticateToken, (req, res) => {
    res.json(credentials[req.user.id] || []);
});

// Add credential
app.post('/credentials', authenticateToken, (req, res) => {
    const { site, username, password, notes } = req.body;
    if (!credentials[req.user.id]) {
        credentials[req.user.id] = [];
    }
    const newCredential = { id: Date.now().toString(), site, username, password, notes };
    credentials[req.user.id].push(newCredential);
    saveData();
    res.status(201).json(newCredential);
});

// Update credential
app.put('/credentials/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { site, username, password, notes } = req.body;
    const userCredentials = credentials[req.user.id];
    if (!userCredentials) {
        return res.status(404).send('Credentials not found');
    }
    const index = userCredentials.findIndex(c => c.id === id);
    if (index === -1) {
        return res.status(404).send('Credential not found');
    }
    userCredentials[index] = { ...userCredentials[index], site, username, password, notes };
    saveData();
    res.json(userCredentials[index]);
});

// Delete credential
app.delete('/credentials/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userCredentials = credentials[req.user.id];
    if (!userCredentials) {
        return res.status(404).send('Credentials not found');
    }
    const index = userCredentials.findIndex(c => c.id === id);
    if (index === -1) {
        return res.status(404).send('Credential not found');
    }
    userCredentials.splice(index, 1);
    saveData();
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

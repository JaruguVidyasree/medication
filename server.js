const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./medicare.db');

// Create Users and Medications tables

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    dosage TEXT,
    frequency TEXT,
    taken INTEGER DEFAULT 0,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);
});

// User Signup
app.post('/signup', (req, res) => {
  const { username, password, role } = req.body;
  db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, password, role], function(err) {
    if (err) return res.status(500).send(err);
    res.send({ id: this.lastID });
  });
});

// User Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err || !row) return res.status(401).send('Invalid credentials');
    res.send(row);
  });
});

// Add Medication
app.post('/medications', (req, res) => {
  const { userId, name, dosage, frequency } = req.body;
  db.run(`INSERT INTO medications (userId, name, dosage, frequency) VALUES (?, ?, ?, ?)`, [userId, name, dosage, frequency], function(err) {
    if (err) return res.status(500).send(err);
    res.send({ id: this.lastID });
  });
});

// Mark Medication as Taken
app.post('/medications/:id/take', (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE medications SET taken = 1 WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).send(err);
    res.send({ success: true });
  });
});

// Get Medication List
app.get('/medications/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(`SELECT * FROM medications WHERE userId = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.send(rows);
  });
});

// Calculate Adherence (basic example)
app.get('/adherence/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(`SELECT * FROM medications WHERE userId = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).send(err);
    const total = rows.length;
    const taken = rows.filter(med => med.taken).length;
    const adherence = total ? (taken / total) * 100 : 0;
    res.send({ adherencePercentage: adherence.toFixed(2) });
  });
});

app.listen(PORT, () => {
  console.log(`MediCare API running at http://localhost:${PORT}`);
});
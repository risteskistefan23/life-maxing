// Life Maxing web server.
// Same logic as the old Electron main.js IPC handlers, exposed as a REST API
// instead, so any browser (including on a phone) can use the app.
//
// DB: @libsql/client works against a local SQLite file (DATABASE_URL=file:...)
// during development, and against a hosted Turso database (DATABASE_URL=libsql://...
// + DATABASE_AUTH_TOKEN) in production — same code, no branching needed.
require('dotenv').config();

const path = require('path');
const express = require('express');
const { createClient } = require('@libsql/client');

const app = express();
app.use(express.json());

// NOTE: intentionally a different filename than the old data/lifemax.db —
// that file is a leftover from an earlier schema (no `data` column) and is
// not compatible with this code. Real historical data lives in the Electron
// app's %APPDATA%\app\life-maxing.db and is migrated separately (see
// scripts/export-data.js + scripts/import-data.js).
// Render's disk is ephemeral — if DATABASE_URL isn't set there, saves silently
// go to a local file that gets wiped on every restart/deploy, and users only
// notice when their data has already vanished. Refuse to start that way.
if (process.env.RENDER && !process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add DATABASE_URL and DATABASE_AUTH_TOKEN in the Render dashboard (Environment tab) so data persists in Turso instead of the ephemeral local disk.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, '..', 'data', 'lifemax-web.db')}`;
const db = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      data TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

// ---- API routes (mirror the old ipcMain handlers 1:1) ----

app.get('/api/daily-entry/:date', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT data FROM daily_entries WHERE date = ?',
      args: [req.params.date]
    });
    const row = result.rows[0];
    res.json(row ? JSON.parse(row.data) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/daily-entry', async (req, res) => {
  try {
    const { date, data } = req.body;
    await db.execute({
      sql: 'INSERT OR REPLACE INTO daily_entries (date, data) VALUES (?, ?)',
      args: [date, JSON.stringify(data)]
    });
    res.json(true);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/weekly-stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    const result = await db.execute({
      sql: 'SELECT date, data FROM daily_entries WHERE date >= ? AND date <= ? ORDER BY date',
      args: [start, end]
    });
    res.json(result.rows.map(r => ({ date: r.date, ...JSON.parse(r.data) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/all-entries', async (req, res) => {
  try {
    const result = await db.execute('SELECT date, data FROM daily_entries ORDER BY date');
    res.json(result.rows.map(r => ({ date: r.date, ...JSON.parse(r.data) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/goals', async (req, res) => {
  try {
    const result = await db.execute("SELECT value FROM settings WHERE key = 'weekly_goals'");
    const row = result.rows[0];
    res.json(row ? JSON.parse(row.value) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('weekly_goals', ?)",
      args: [JSON.stringify(req.body)]
    });
    res.json(true);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Serve the built React app ----
const buildDir = path.join(__dirname, 'build');
app.use(express.static(buildDir));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

const PORT = process.env.PORT || 3001;
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Life Maxing server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  });

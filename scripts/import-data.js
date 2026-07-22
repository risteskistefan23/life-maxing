// One-off: load scripts/export.json (produced by export-data.js) into
// whatever database DATABASE_URL/.env currently points at — i.e. your
// Turso database once it's set up. Run with: node scripts/import-data.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const inPath = path.join(__dirname, 'export.json');
if (!fs.existsSync(inPath)) {
  console.error(`Не најдов ${inPath}. Прво пушти: node scripts/export-data.js`);
  process.exit(1);
}
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('libsql://')) {
  console.error('DATABASE_URL во .env мора да е Turso libsql:// адреса пред да импортираш.');
  process.exit(1);
}

const { entries, settings } = JSON.parse(fs.readFileSync(inPath, 'utf8'));

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
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

  for (const e of entries) {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO daily_entries (date, data) VALUES (?, ?)',
      args: [e.date, e.data]
    });
  }
  for (const s of settings) {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      args: [s.key, s.value]
    });
  }

  console.log(`Импортирани ${entries.length} денови и ${settings.length} поставки во Turso.`);
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

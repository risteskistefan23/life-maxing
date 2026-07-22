// One-off: dump the real Electron desktop DB (%APPDATA%\app\life-maxing.db)
// to a JSON file, so it can be imported into Turso for the web version.
// Run with: node scripts/export-data.js
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(process.env.APPDATA, 'app', 'life-maxing.db');
const outPath = path.join(__dirname, 'export.json');

if (!fs.existsSync(dbPath)) {
  console.error(`Не ја најдов базата на: ${dbPath}`);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
});

db.all('SELECT date, data FROM daily_entries ORDER BY date', (err, entries) => {
  if (err) {
    console.error('Failed to read daily_entries:', err.message);
    process.exit(1);
  }
  db.all('SELECT key, value FROM settings', (err2, settings) => {
    if (err2) {
      console.error('Failed to read settings:', err2.message);
      process.exit(1);
    }
    fs.writeFileSync(outPath, JSON.stringify({ entries, settings }, null, 2));
    console.log(`Извезени ${entries.length} денови и ${settings.length} поставки -> ${outPath}`);
    db.close();
  });
});

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Keep a fixed app name so the database always lives in the same place
// (%APPDATA%\app\life-maxing.db) regardless of how the app is launched.
app.setName('app');

let mainWindow;
let db;

// Development mode (DevTools) is opt-in via env flag. Normal launch = production.
const isDev = process.env.LM_DEV === '1';

// Resolve asset paths relative to the app folder (the working directory).
const appRoot = process.cwd();

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'life-maxing.db');
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      db.run(`
        CREATE TABLE IF NOT EXISTS daily_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT UNIQUE,
          data TEXT
        )
      `, (err) => {
        if (err) return reject(err);
        db.run(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(appRoot, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(appRoot, 'build', 'index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await initDB();
    createWindow();
  } catch (err) {
    console.error('Failed to initialize:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (db) db.close();
});

// ---- IPC (invoke/handle: reliable request/response) ----

ipcMain.handle('get-daily-entry', (event, date) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not ready'));
    db.get('SELECT data FROM daily_entries WHERE date = ?', [date], (err, row) => {
      if (err) return reject(err);
      resolve(row ? JSON.parse(row.data) : null);
    });
  });
});

ipcMain.handle('save-daily-entry', (event, { date, data }) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not ready'));
    db.run(
      'INSERT OR REPLACE INTO daily_entries (date, data) VALUES (?, ?)',
      [date, JSON.stringify(data)],
      (err) => {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
});

ipcMain.handle('get-weekly-stats', (event, { start, end }) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not ready'));
    db.all(
      'SELECT date, data FROM daily_entries WHERE date >= ? AND date <= ? ORDER BY date',
      [start, end],
      (err, rows) => {
        if (err) return reject(err);
        // Flatten each row so the renderer can read e.gym, e.cardio, ... directly.
        resolve((rows || []).map(r => ({ date: r.date, ...JSON.parse(r.data) })));
      }
    );
  });
});

ipcMain.handle('get-all-entries', () => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not ready'));
    db.all('SELECT date, data FROM daily_entries ORDER BY date', (err, rows) => {
      if (err) return reject(err);
      // Flatten so the renderer can read e.date, e.gym, e.money_amount, ... directly.
      resolve((rows || []).map(r => ({ date: r.date, ...JSON.parse(r.data) })));
    });
  });
});

ipcMain.handle('get-goals', () => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not ready'));
    db.get("SELECT value FROM settings WHERE key = 'weekly_goals'", (err, row) => {
      if (err) return reject(err);
      resolve(row ? JSON.parse(row.value) : null);
    });
  });
});

ipcMain.handle('save-goals', (event, goals) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not ready'));
    db.run(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('weekly_goals', ?)",
      [JSON.stringify(goals)],
      (err) => {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
});

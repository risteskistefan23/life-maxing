// Browser-side API client. Same method names/shapes as the old window.electron
// bridge (see the removed preload.js), just backed by fetch() to the Express
// server instead of Electron IPC — so this works in any browser, phone included.
// In dev, CRA's "proxy" field in package.json forwards /api/* to the local
// server. In production, the server serves this same build, so relative
// paths hit the right place automatically.

async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const api = {
  getDailyEntry: (date) => request(`/api/daily-entry/${encodeURIComponent(date)}`),
  saveDailyEntry: (date, data) =>
    request('/api/daily-entry', { method: 'POST', body: JSON.stringify({ date, data }) }),
  getWeeklyStats: (start, end) =>
    request(`/api/weekly-stats?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getAllEntries: () => request('/api/all-entries'),
  getGoals: () => request('/api/goals'),
  saveGoals: (goals) => request('/api/goals', { method: 'POST', body: JSON.stringify(goals) })
};

export default api;

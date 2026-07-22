const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getDailyEntry: (date) => ipcRenderer.invoke('get-daily-entry', date),
  saveDailyEntry: (date, data) => ipcRenderer.invoke('save-daily-entry', { date, data }),
  getWeeklyStats: (start, end) => ipcRenderer.invoke('get-weekly-stats', { start, end }),
  getAllEntries: () => ipcRenderer.invoke('get-all-entries'),
  getGoals: () => ipcRenderer.invoke('get-goals'),
  saveGoals: (goals) => ipcRenderer.invoke('save-goals', goals)
});

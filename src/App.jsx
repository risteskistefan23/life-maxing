import React, { useState, useEffect } from 'react';
import './styles.css';
import api from './api';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import WeeklyStats from './components/WeeklyStats';
import ProgressStats from './components/ProgressStats';

export default function App() {
  const todayDate = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(todayDate);
  const [view, setView] = useState('daily'); // 'daily' or 'weekly'
  const [entries, setEntries] = useState({});

  useEffect(() => {
    loadEntry(currentDate);
  }, [currentDate]);

  const loadEntry = async (date) => {
    try {
      const entry = await api.getDailyEntry(date);
      setEntries(prev => ({
        ...prev,
        [date]: entry || {}
      }));
    } catch (err) {
      console.error('Failed to load entry:', err);
    }
  };

  const saveEntry = async (data) => {
    // Only future days are locked — past days and today can be edited.
    if (currentDate > todayDate) return;
    try {
      await api.saveDailyEntry(currentDate, data);
      setEntries(prev => ({
        ...prev,
        [currentDate]: data
      }));
    } catch (err) {
      console.error('Failed to save entry:', err);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Life Maxing</h1>
        <div className="view-toggle">
          <button
            className={view === 'daily' ? 'active' : ''}
            onClick={() => setView('daily')}
          >
            Дневно
          </button>
          <button
            className={view === 'weekly' ? 'active' : ''}
            onClick={() => setView('weekly')}
          >
            Неделно
          </button>
          <button
            className={view === 'progress' ? 'active' : ''}
            onClick={() => setView('progress')}
          >
            Прогрес
          </button>
        </div>
      </header>

      <div className="app-content">
        {view === 'daily' ? (
          <div className="daily-view">
            <Calendar currentDate={currentDate} setCurrentDate={setCurrentDate} todayDate={todayDate} />
            <Dashboard
              date={currentDate}
              entry={entries[currentDate]}
              onSave={saveEntry}
              todayDate={todayDate}
            />
          </div>
        ) : view === 'weekly' ? (
          <WeeklyStats currentDate={currentDate} />
        ) : (
          <ProgressStats />
        )}
      </div>
    </div>
  );
}

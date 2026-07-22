import React, { useState, useEffect } from 'react';
import api from '../api';

const DEFAULT_GOALS = {
  gym: 4,
  cardio: 3,
  faculty: 4,
  business: 10,
  girls: 3,
  reading: 100,
  money: 100
};

export default function WeeklyStats({ currentDate }) {
  const [stats, setStats] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [editing, setEditing] = useState(false);
  const [draftGoals, setDraftGoals] = useState(DEFAULT_GOALS);

  useEffect(() => {
    loadWeeklyData();
  }, [currentDate]);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const saved = await api.getGoals();
      if (saved) setGoals({ ...DEFAULT_GOALS, ...saved });
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  };

  const loadWeeklyData = async () => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    try {
      const entries = await api.getWeeklyStats(startStr, endStr);

      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
      setWeekDates(dates);

      const weekStats = {
        gym: entries.filter(e => e.gym === 1).length,
        cardio: entries.filter(e => e.cardio === 1).length,
        faculty: entries.reduce((sum, e) => sum + (e.faculty_hours || 0), 0),
        business: entries.reduce((sum, e) => sum + (e.business_hours || 0), 0),
        girls: entries.filter(e => e.girls === 1).length,
        reading: entries.reduce((sum, e) => sum + (e.reading_pages || 0), 0),
        money: entries.reduce((sum, e) => sum + (e.money_amount || 0), 0),
      };
      setStats(weekStats);
    } catch (err) {
      console.error('Failed to load weekly stats:', err);
    }
  };

  const startEdit = () => {
    setDraftGoals(goals);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    try {
      await api.saveGoals(draftGoals);
      setGoals(draftGoals);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save goals:', err);
    }
  };

  const handleGoalChange = (key, value) => {
    setDraftGoals(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  if (!stats) return <div className="weekly-stats">Вчитување...</div>;

  const metrics = [
    { key: 'gym', label: 'Шипки/Теретана', unit: 'денови' },
    { key: 'cardio', label: 'Кардио/10.000 чекори', unit: 'денови' },
    { key: 'faculty', label: 'Учење факултет', unit: 'часови' },
    { key: 'business', label: 'Бизнис/Работа', unit: 'часови' },
    { key: 'girls', label: 'Девојка (излегување)', unit: 'пати' },
    { key: 'reading', label: 'Читање', unit: 'страни' },
    { key: 'money', label: 'Пари заработени', unit: '$' }
  ];

  const fmt = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(1));

  return (
    <div className="weekly-stats">
      <div className="weekly-header">
        <h2>Неделни статистики</h2>
        {editing ? (
          <div className="goals-edit-actions">
            <button className="save-goals-btn" onClick={saveEdit}>Зачувај</button>
            <button className="cancel-goals-btn" onClick={cancelEdit}>Откажи</button>
          </div>
        ) : (
          <button className="edit-goals-btn" onClick={startEdit}>✏️ Промени цели</button>
        )}
      </div>
      <div className="week-range">
        {weekDates.length > 0 && (
          <p>
            {new Date(weekDates[0]).toLocaleDateString()} - {new Date(weekDates[6]).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="stats-grid">
        {metrics.map((m) => {
          const current = stats[m.key];
          const goal = goals[m.key];
          const progress = Math.min((current / goal) * 100, 100);
          const met = current >= goal;
          return (
            <div key={m.key} className={`stat-card ${met ? 'met' : 'unmet'}`}>
              <h4>{m.label}</h4>
              {editing ? (
                <div className="stat-value goal-edit-row">
                  {fmt(current)} /{' '}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={draftGoals[m.key]}
                    onChange={(e) => handleGoalChange(m.key, e.target.value)}
                    className="goal-input"
                  />{' '}
                  {m.unit}
                </div>
              ) : (
                <div className="stat-value">
                  {fmt(current)} / {goal} {m.unit}
                </div>
              )}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

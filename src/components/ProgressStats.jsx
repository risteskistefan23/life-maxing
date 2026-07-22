import React, { useState, useEffect } from 'react';
import api from '../api';

// Same daily-goal logic as the Dashboard. A day is "productive" if 4+ goals are met.
function goalsMet(e) {
  let c = 0;
  if (e.gym === 1) c++;
  if (e.cardio === 1) c++;
  if (e.faculty === 1 && (e.faculty_hours || 0) >= 1) c++;
  if (e.business === 1 && (e.business_hours || 0) >= 3) c++;
  if (e.girls === 1 && e.girls_nice === 1) c++;
  if (e.reading === 1 && (e.reading_pages || 0) >= 10) c++;
  if (e.money === 1) c++;
  return c;
}
const GOOD_DAY = 4;

const toKey = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const fmt = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(1));

export default function ProgressStats() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await api.getAllEntries();
        setEntries(all || []);
      } catch (err) {
        console.error('Failed to load entries:', err);
        setEntries([]);
      }
    })();
  }, []);

  if (!entries) return <div className="progress-stats">Вчитување...</div>;

  if (entries.length === 0) {
    return (
      <div className="progress-stats">
        <h2>Прогрес</h2>
        <p className="empty-note">Сè уште нема податоци. Пополни неколку денови за да видиш статистика. 📈</p>
      </div>
    );
  }

  // ---- All-time totals ----
  const totals = {
    activeDays: entries.length,
    money: entries.reduce((s, e) => s + (e.money_amount || 0), 0),
    pages: entries.reduce((s, e) => s + (e.reading_pages || 0), 0),
    hours: entries.reduce((s, e) => s + (e.faculty_hours || 0) + (e.business_hours || 0), 0),
  };

  // ---- Streaks (consecutive productive days) ----
  const goodByDate = {};
  entries.forEach((e) => { goodByDate[e.date] = goalsMet(e) >= GOOD_DAY; });

  const today = new Date(toKey(new Date()));
  // Current streak: count back from today (grace: if today not done yet, start at yesterday).
  let cursor = goodByDate[toKey(today)] ? today : addDays(today, -1);
  let currentStreak = 0;
  while (goodByDate[toKey(cursor)]) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }
  // Best streak: scan every day from first entry to today.
  let bestStreak = 0;
  let run = 0;
  const firstDate = new Date(entries[0].date);
  for (let d = new Date(firstDate); d <= today; d = addDays(d, 1)) {
    if (goodByDate[toKey(d)]) { run++; bestStreak = Math.max(bestStreak, run); }
    else run = 0;
  }

  // ---- This month vs last month ----
  const ym = toKey(today).slice(0, 7);
  const [y, m] = ym.split('-').map(Number);
  const lastY = m === 1 ? y - 1 : y;
  const lastM = m === 1 ? 12 : m - 1;
  const lastKey = `${lastY}-${String(lastM).padStart(2, '0')}`;

  const sumFor = (key) => {
    const list = entries.filter((e) => e.date.startsWith(key));
    return {
      productive: list.filter((e) => goalsMet(e) >= GOOD_DAY).length,
      gym: list.filter((e) => e.gym === 1).length,
      cardio: list.filter((e) => e.cardio === 1).length,
      faculty: list.reduce((s, e) => s + (e.faculty_hours || 0), 0),
      business: list.reduce((s, e) => s + (e.business_hours || 0), 0),
      pages: list.reduce((s, e) => s + (e.reading_pages || 0), 0),
      money: list.reduce((s, e) => s + (e.money_amount || 0), 0),
    };
  };
  const thisM = sumFor(ym);
  const lastM2 = sumFor(lastKey);

  const compareRows = [
    { label: 'Продуктивни денови', a: thisM.productive, b: lastM2.productive, unit: 'дена' },
    { label: 'Сала', a: thisM.gym, b: lastM2.gym, unit: 'дена' },
    { label: 'Кардио', a: thisM.cardio, b: lastM2.cardio, unit: 'дена' },
    { label: 'Факултет', a: thisM.faculty, b: lastM2.faculty, unit: 'ч' },
    { label: 'Бизнис', a: thisM.business, b: lastM2.business, unit: 'ч' },
    { label: 'Читање', a: thisM.pages, b: lastM2.pages, unit: 'стр' },
    { label: 'Пари', a: thisM.money, b: lastM2.money, unit: '$' },
  ];

  // ---- Last 8 weeks: productive days per week (Sunday start) ----
  const todayDow = today.getDay();
  const startOfThisWeek = addDays(today, -todayDow);
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const ws = addDays(startOfThisWeek, -w * 7);
    let count = 0;
    for (let i = 0; i < 7; i++) {
      if (goodByDate[toKey(addDays(ws, i))]) count++;
    }
    const label = `${String(ws.getDate()).padStart(2, '0')}.${String(ws.getMonth() + 1).padStart(2, '0')}`;
    weeks.push({ label, count });
  }
  const maxWeek = Math.max(...weeks.map((w) => w.count), 1);

  const summary = [
    { label: 'Активни денови', value: totals.activeDays },
    { label: 'Вкупно пари', value: `$${fmt(totals.money)}` },
    { label: 'Прочитани страни', value: fmt(totals.pages) },
    { label: 'Часови (факс+бизнис)', value: `${fmt(totals.hours)}ч` },
  ];

  return (
    <div className="progress-stats">
      <h2>Прогрес</h2>

      {/* All-time totals */}
      <div className="summary-row">
        {summary.map((s) => (
          <div key={s.label} className="summary-card">
            <div className="summary-value">{s.value}</div>
            <div className="summary-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Streaks */}
      <div className="streak-row">
        <div className="streak-card">
          <div className="streak-value">🔥 {currentStreak}</div>
          <div className="summary-label">Тековна серија (дена)</div>
        </div>
        <div className="streak-card">
          <div className="streak-value">🏆 {bestStreak}</div>
          <div className="summary-label">Најдолга серија (дена)</div>
        </div>
      </div>

      {/* Month comparison */}
      <h3 className="section-title">Овој месец наспроти минатиот</h3>
      <div className="compare-list">
        {compareRows.map((r) => {
          const delta = r.a - r.b;
          const pct = r.b > 0 ? Math.round((delta / r.b) * 100) : (r.a > 0 ? 100 : 0);
          const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
          const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–';
          return (
            <div key={r.label} className="compare-row">
              <span className="compare-label">{r.label}</span>
              <span className="compare-values">
                <b>{fmt(r.a)}</b> <span className="compare-prev">/ {fmt(r.b)} {r.unit}</span>
              </span>
              <span className={`compare-delta ${dir}`}>
                {arrow} {delta === 0 ? '0' : `${Math.abs(pct)}%`}
              </span>
            </div>
          );
        })}
      </div>

      {/* 8-week chart */}
      <h3 className="section-title">Продуктивни денови (последни 8 недели)</h3>
      <div className="chart">
        {weeks.map((w, i) => (
          <div key={i} className="chart-col">
            <div className="chart-count">{w.count}</div>
            <div className="chart-bar-wrap">
              <div
                className="chart-bar"
                style={{ height: `${(w.count / maxWeek) * 100}%` }}
              ></div>
            </div>
            <div className="chart-label">{w.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Calendar({ currentDate, setCurrentDate, todayDate }) {
  const [year, setYear] = useState(new Date(currentDate).getFullYear());
  const [month, setMonth] = useState(new Date(currentDate).getMonth());
  const [entries, setEntries] = useState([]);
  const [showSelectors, setShowSelectors] = useState(false);

  const todayObj = new Date(todayDate);
  const todayYear = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth();
  const todayDay = todayObj.getDate();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const allEntries = await api.getAllEntries();
      setEntries((allEntries || []).map(e => e.date));
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    // Don't allow navigation to future months
    if (year > todayYear || (year === todayYear && month >= todayMonth)) {
      return;
    }
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    setCurrentDate(todayDate);
    setYear(todayYear);
    setMonth(todayMonth);
    setShowSelectors(false);
  };

  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCurrentDate(dateStr);
  };

  const monthNames = [
    'Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
    'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
  ];

  const days = [];
  const totalCells = firstDayOfMonth(year, month) + daysInMonth(year, month);
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDayOfMonth(year, month)) {
      days.push(null);
    } else {
      days.push(i - firstDayOfMonth(year, month) + 1);
    }
  }

  const dayHeaders = ['Нед', 'Пон', 'Вто', 'Сре', 'Чет', 'Пет', 'Саб'];

  const currentDateObj = new Date(currentDate);
  const currentDay = currentDateObj.getDate();

  const handleHeaderClick = () => {
    setShowSelectors(!showSelectors);
  };

  const handleYearChange = (e) => {
    setYear(Number(e.target.value));
  };

  const handleMonthChange = (e) => {
    setMonth(Number(e.target.value));
  };

  const handleDayChange = (e) => {
    const day = Number(e.target.value);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCurrentDate(dateStr);
    setShowSelectors(false);
  };

  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
  const daysInMonthNum = daysInMonth(year, month);
  const daysArray = Array.from({ length: daysInMonthNum }, (_, i) => i + 1);

  const canGoNext = year < todayYear || (year === todayYear && month < todayMonth);

  return (
    <div className="calendar">
      <div className="calendar-header">
        {!showSelectors && (
          <>
            <button onClick={handlePrevMonth} className="nav-btn">←</button>
            <h3 onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>{monthNames[month]} {year}</h3>
            <button
              onClick={handleNextMonth}
              className="nav-btn"
              disabled={!canGoNext}
              style={{ opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'default' }}
            >
              →
            </button>
          </>
        )}
        {showSelectors && (
          <div className="header-selectors">
            <select value={year} onChange={handleYearChange}>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select value={month} onChange={handleMonthChange}>
              {monthNames.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select value={currentDay} onChange={handleDayChange}>
              {daysArray.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={handleToday} className="today-btn">Денес</button>
      </div>

      <div className="calendar-weekdays">
        {dayHeaders.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="day empty"></div>;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isCurrentDate = dateStr === currentDate;
          const hasEntry = entries.includes(dateStr);
          const isFuture = dateStr > todayDate;
          return (
            <button
              key={day}
              className={`day ${isCurrentDate ? 'selected' : ''} ${hasEntry ? 'has-entry' : ''} ${isFuture ? 'disabled' : ''}`}
              onClick={() => !isFuture && handleDateClick(day)}
              disabled={isFuture}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

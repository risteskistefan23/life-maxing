import React, { useState, useEffect } from 'react';

export default function Dashboard({ date, entry, onSave, todayDate }) {
  const isLocked = date > todayDate;

  // idle | saving | saved | error — visible feedback so a failed save
  // (e.g. server still waking up from sleep) is never silent.
  const [saveState, setSaveState] = useState('idle');

  const [formData, setFormData] = useState({
    gym: false,
    cardio: false,
    faculty: false,
    faculty_hours: 0,
    business: false,
    business_hours: 0,
    girls: false,
    girls_nice: false,
    reading: false,
    reading_pages: 0,
    money: false,
    money_amount: 0
  });

  useEffect(() => {
    if (entry && Object.keys(entry).length > 0) {
      setFormData({
        gym: entry.gym === 1,
        cardio: entry.cardio === 1,
        faculty: entry.faculty === 1,
        faculty_hours: entry.faculty_hours || 0,
        business: entry.business === 1,
        business_hours: entry.business_hours || 0,
        girls: entry.girls === 1,
        girls_nice: entry.girls_nice === 1,
        reading: entry.reading === 1,
        reading_pages: entry.reading_pages || 0,
        money: entry.money === 1,
        money_amount: entry.money_amount || 0
      });
    } else {
      setFormData({
        gym: false,
        cardio: false,
        faculty: false,
        faculty_hours: 0,
        business: false,
        business_hours: 0,
        girls: false,
        girls_nice: false,
        reading: false,
        reading_pages: 0,
        money: false,
        money_amount: 0
      });
    }
    setSaveState('idle');
  }, [date, entry]);

  const handleYes = (field, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isLocked) return;
    setFormData(prev => ({ ...prev, [field]: true }));
  };

  const handleNo = (field, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isLocked) return;
    setFormData(prev => ({ ...prev, [field]: false }));
  };

  const handleApply = async () => {
    // If the main question is "Не", any sub-answer typed earlier (before
    // switching away from "Да") must not be saved — otherwise stale hours/
    // pages/amounts sneak into totals for a day where the answer is "No".
    const dataToSave = {
      gym: formData.gym ? 1 : 0,
      cardio: formData.cardio ? 1 : 0,
      faculty: formData.faculty ? 1 : 0,
      faculty_hours: formData.faculty ? (Number(formData.faculty_hours) || 0) : 0,
      business: formData.business ? 1 : 0,
      business_hours: formData.business ? (Number(formData.business_hours) || 0) : 0,
      girls: formData.girls ? 1 : 0,
      girls_nice: formData.girls ? (formData.girls_nice ? 1 : 0) : 0,
      reading: formData.reading ? 1 : 0,
      reading_pages: formData.reading ? (Number(formData.reading_pages) || 0) : 0,
      money: formData.money ? 1 : 0,
      money_amount: formData.money ? (Number(formData.money_amount) || 0) : 0
    };
    setSaveState('saving');
    try {
      await onSave(dataToSave);
      setSaveState('saved');
    } catch (err) {
      console.error('Failed to save entry:', err);
      setSaveState('error');
    }
  };

  // Keep the raw typed string in state (not parsed to a number on every
  // keystroke) — otherwise clearing the field to type a new value snaps
  // straight back to 0 before the user can type anything.
  const handleNumberChange = (field, value) => {
    if (isLocked) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getDailyGoals = () => {
    const goals = [
      { met: formData.gym, text: 'Сала' },
      { met: formData.cardio, text: 'Кардио' },
      { met: formData.faculty && formData.faculty_hours >= 1, text: 'Факултет (1ч+)' },
      { met: formData.business && formData.business_hours >= 3, text: 'Бизнис (3ч+)' },
      { met: formData.girls && formData.girls_nice, text: 'Девојки (лиубезно)' },
      { met: formData.reading && formData.reading_pages >= 10, text: 'Читање (10+ страни)' },
      { met: formData.money, text: 'Пари' }
    ];
    const completedCount = goals.filter(g => g.met).length;
    return { goals, completedCount, total: 7 };
  };

  const { goals, completedCount, total } = getDailyGoals();
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={isLocked ? 'dashboard locked' : 'dashboard'}>
      <div className="dashboard-header">
        <h2>{formattedDate}</h2>
        <div className="daily-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(completedCount / total) * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">{completedCount} / {total} Цели</p>
        </div>
      </div>

      <div className="daily-goals-summary">
        {goals.map((goal, idx) => (
          <div key={idx} className={`goal-badge ${goal.met ? 'met' : 'unmet'}`}>
            {goal.text}
          </div>
        ))}
      </div>

      <div className="dashboard-form">
        <div className="form-section">
          <h3>Прашања</h3>

          {/* Q1: Gym */}
          <div className="form-group">
            <label>1. Дали бевте денес на шипки/теретана?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.gym ? 'active' : ''}`}
                onClick={(e) => handleYes('gym', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.gym ? 'active' : ''}`}
                onClick={(e) => handleNo('gym', e)}
              >
                Не
              </button>
            </div>
          </div>

          {/* Q2: Cardio */}
          <div className="form-group">
            <label>2. Дали направивте кардио или 10.000 чекори?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.cardio ? 'active' : ''}`}
                onClick={(e) => handleYes('cardio', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.cardio ? 'active' : ''}`}
                onClick={(e) => handleNo('cardio', e)}
              >
                Не
              </button>
            </div>
          </div>

          {/* Q3: Faculty */}
          <div className="form-group">
            <label>3. Дали учивте за факултет?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.faculty ? 'active' : ''}`}
                onClick={(e) => handleYes('faculty', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.faculty ? 'active' : ''}`}
                onClick={(e) => handleNo('faculty', e)}
              >
                Не
              </button>
            </div>
            {formData.faculty && (
              <div className="nested-question">
                <label>Колку саати учеше?</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.faculty_hours}
                  onChange={(e) => handleNumberChange('faculty_hours', e.target.value)}
                  placeholder="Часови"
                  disabled={isLocked}
                />
              </div>
            )}
          </div>

          {/* Q4: Business */}
          <div className="form-group">
            <label>4. Дали работивте на бизнис?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.business ? 'active' : ''}`}
                onClick={(e) => handleYes('business', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.business ? 'active' : ''}`}
                onClick={(e) => handleNo('business', e)}
              >
                Не
              </button>
            </div>
            {formData.business && (
              <div className="nested-question">
                <label>Колку саати работеше?</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.business_hours}
                  onChange={(e) => handleNumberChange('business_hours', e.target.value)}
                  placeholder="Часови"
                  disabled={isLocked}
                />
              </div>
            )}
          </div>

          {/* Q5: Girls */}
          <div className="form-group">
            <label>5. Дали излеговте со девојки?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.girls ? 'active' : ''}`}
                onClick={(e) => handleYes('girls', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.girls ? 'active' : ''}`}
                onClick={(e) => handleNo('girls', e)}
              >
                Не
              </button>
            </div>
            {formData.girls && (
              <div className="nested-question">
                <label>Дали направивте нешто лиубезно за неа?</label>
                <div className="yes-no-buttons">
                  <button
                    type="button"
                    className={`yes-btn ${formData.girls_nice ? 'active' : ''}`}
                    onClick={(e) => handleYes('girls_nice', e)}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    className={`no-btn ${!formData.girls_nice ? 'active' : ''}`}
                    onClick={(e) => handleNo('girls_nice', e)}
                  >
                    Не
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Q6: Reading */}
          <div className="form-group">
            <label>6. Дали читавте книга?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.reading ? 'active' : ''}`}
                onClick={(e) => handleYes('reading', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.reading ? 'active' : ''}`}
                onClick={(e) => handleNo('reading', e)}
              >
                Не
              </button>
            </div>
            {formData.reading && (
              <div className="nested-question">
                <label>Колку страни прочита?</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reading_pages}
                  onChange={(e) => handleNumberChange('reading_pages', e.target.value)}
                  placeholder="Страни"
                  disabled={isLocked}
                />
              </div>
            )}
          </div>

          {/* Q7: Money */}
          <div className="form-group">
            <label>7. Дали заработи пари?</label>
            <div className="yes-no-buttons">
              <button
                type="button"
                className={`yes-btn ${formData.money ? 'active' : ''}`}
                onClick={(e) => handleYes('money', e)}
              >
                Да
              </button>
              <button
                type="button"
                className={`no-btn ${!formData.money ? 'active' : ''}`}
                onClick={(e) => handleNo('money', e)}
              >
                Не
              </button>
            </div>
            {formData.money && (
              <div className="nested-question">
                <label>Колку пари заработи? ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.money_amount}
                  onChange={(e) => handleNumberChange('money_amount', e.target.value)}
                  placeholder="Сума ($)"
                  disabled={isLocked}
                />
              </div>
            )}
          </div>
        </div>

        {isLocked ? (
          <p className="locked-note">🔒 Не може однапред да се пополнува иден ден.</p>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px', marginTop: '30px' }}>
            {saveState === 'saving' && <span className="save-status saving">Се зачувува...</span>}
            {saveState === 'saved' && <span className="save-status saved">✓ Зачувано</span>}
            {saveState === 'error' && (
              <span className="save-status error">⚠ Не се зачува — провери интернет и пробај повторно</span>
            )}
            <button
              type="button"
              className="apply-btn"
              onClick={handleApply}
              disabled={saveState === 'saving'}
            >
              Примени
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

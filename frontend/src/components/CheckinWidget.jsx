import React, { useState, useEffect } from 'react';
import { Smile, Meh, Frown, Sparkles, Clock, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { fetchDailyQuestion, submitCheckin } from '../api';

export default function CheckinWidget({ studentId, asOfDate, onCheckinComplete, isAlreadyCheckedIn, todayCheckin }) {
  const [mood, setMood] = useState(todayCheckin?.mood || 3);
  const [stress, setStress] = useState(todayCheckin?.stress || 2);
  const [mainFactor, setMainFactor] = useState(todayCheckin?.main_factor || 'Studies');
  const [microQuestion, setMicroQuestion] = useState(null);
  const [microValue, setMicroValue] = useState(todayCheckin?.micro_value || 7.0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(isAlreadyCheckedIn);
  const [submittedMessage, setSubmittedMessage] = useState('');

  useEffect(() => {
    if (studentId) {
      fetchDailyQuestion(studentId)
        .then((res) => {
          setMicroQuestion(res);
          if (res.selected_question?.options) {
            setMicroValue(res.selected_question.options[2]?.value || 7.0);
          } else if (res.selected_question?.min !== undefined) {
            setMicroValue(4.0);
          }
        })
        .catch(console.error);
    }
  }, [studentId, asOfDate]);

  useEffect(() => {
    if (todayCheckin) {
      setMood(todayCheckin.mood);
      setStress(todayCheckin.stress);
      setMainFactor(todayCheckin.main_factor || 'Studies');
      setMicroValue(todayCheckin.micro_value || 7.0);
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  }, [todayCheckin, asOfDate]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const qKey = microQuestion?.selected_question?.key || 'sleep';
      const payload = {
        student_id: studentId,
        date: asOfDate,
        mood: parseInt(mood, 10),
        stress: parseInt(stress, 10),
        main_factor: mainFactor,
        micro_key: qKey,
        micro_value: parseFloat(microValue)
      };

      const res = await submitCheckin(payload);
      setSubmitted(true);
      setSubmittedMessage('Check-in logged in 18 seconds! Personal band updated.');
      if (onCheckinComplete) onCheckinComplete(res);
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const factorOptions = ['Studies', 'Sleep', 'Screen', 'Social', 'Personal', 'Routine'];

  return (
    <div className="drift-card drift-card-glow" id="checkin-widget" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <span className="badge badge-teal" style={{ marginBottom: '6px' }}>Daily Micro Check-in</span>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Today's 25-Second Check-in</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            {asOfDate ? `Logging for ${asOfDate}` : '3 core taps + 1 rotating micro-question'}
          </p>
        </div>
        {submitted && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <CheckCircle2 size={16} />
            <span>Completed for Today</span>
          </div>
        )}
      </div>

      {/* Row 1: Mood Tap */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
          1. How is your overall feeling today?
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            id="tap-mood-good"
            type="button"
            className={`tap-button ${mood === 5 ? 'active' : ''}`}
            onClick={() => setMood(5)}
          >
            <Smile size={24} color="#2dd4bf" />
            <span>Good (5)</span>
          </button>
          <button
            id="tap-mood-okay"
            type="button"
            className={`tap-button ${mood === 3 ? 'active' : ''}`}
            onClick={() => setMood(3)}
          >
            <Meh size={24} color="#f59e0b" />
            <span>Okay (3)</span>
          </button>
          <button
            id="tap-mood-low"
            type="button"
            className={`tap-button ${mood === 1 ? 'active' : ''}`}
            onClick={() => setMood(1)}
          >
            <Frown size={24} color="#f43f5e" />
            <span>Not Good (1)</span>
          </button>
        </div>
      </div>

      {/* Row 2: Stress Scale (1-5) */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
            2. Current Stress Pressure: <span style={{ color: '#2dd4bf' }}>Level {stress} / 5</span>
          </label>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {stress <= 2 ? 'Low & Manageable' : stress === 3 ? 'Moderate' : 'High Demand'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              id={`tap-stress-${lvl}`}
              key={lvl}
              type="button"
              className={`tap-button ${stress === lvl ? 'active' : ''}`}
              onClick={() => setStress(lvl)}
              style={{ padding: '10px 4px' }}
            >
              <span style={{ fontSize: '16px' }}>{lvl}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {lvl === 1 ? 'Calm' : lvl === 3 ? 'Medium' : lvl === 5 ? 'Peak' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Primary Factor */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
          3. Primary contributing factor today:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {factorOptions.map((factor) => (
            <button
              id={`tap-factor-${factor.toLowerCase()}`}
              key={factor}
              type="button"
              onClick={() => setMainFactor(factor)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                border: mainFactor === factor ? '1px solid #14b8a6' : '1px solid rgba(255,255,255,0.08)',
                background: mainFactor === factor ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255,255,255,0.04)',
                color: mainFactor === factor ? '#2dd4bf' : '#cbd5e1',
                transition: 'all 0.15s ease'
              }}
            >
              {factor}
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: Question Budget Rotating Micro-Question */}
      {microQuestion && microQuestion.selected_question && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rotating Micro-Question ({microQuestion.selected_question.title})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <Clock size={14} />
              <span>~5 seconds</span>
            </div>
          </div>

          <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
            {microQuestion.selected_question.prompt}
          </p>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', fontStyle: 'italic' }}>
            Reason asked: {microQuestion.reason_asked}
          </p>

          {/* Render Options: Buckets or Slider */}
          {microQuestion.selected_question.options ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {microQuestion.selected_question.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMicroValue(opt.value)}
                  style={{
                    flex: '1 1 auto',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: microValue === opt.value ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    background: microValue === opt.value ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.04)',
                    color: microValue === opt.value ? '#ffffff' : '#cbd5e1'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Value: {microValue} {microQuestion.selected_question.unit}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Range: {microQuestion.selected_question.min} - {microQuestion.selected_question.max}</span>
              </div>
              <input
                type="range"
                min={microQuestion.selected_question.min || 0}
                max={microQuestion.selected_question.max || 12}
                step={microQuestion.selected_question.step || 0.5}
                value={microValue}
                onChange={(e) => setMicroValue(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          Takes ~25s • Never silently invents data
        </span>
        <button
          id="submit-checkin-btn"
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Logging...' : (submitted ? 'Update Check-in' : 'Submit 25s Check-in')}
          <ChevronRight size={18} />
        </button>
      </div>

      {submittedMessage && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#34d399', textAlign: 'right' }}>
          {submittedMessage}
        </div>
      )}
    </div>
  );
}

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
    <div className="drift-card card-accent-teal" id="checkin-widget" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="glow-pill-teal" style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
              Daily Micro Check-in
            </span>
            <span style={{ fontSize: '11px', color: '#84938B', fontWeight: 500 }}>25-second reflection</span>
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#24332F', letterSpacing: '-0.3px' }}>
            Today's Check-in &amp; Baseline Update
          </h2>
          <p style={{ fontSize: '13px', color: '#63736B' }}>
            {asOfDate ? `Logging snapshot for ${asOfDate}` : '3 quick taps + 1 rotating micro-question'}
          </p>
        </div>
        {submitted && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--soft-sage)',
            border: '1px solid #C4D9C7',
            color: 'var(--primary-brand)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)'
          }}>
            <CheckCircle2 size={16} />
            <span>Logged for Today</span>
          </div>
        )}
      </div>

      {/* Row 1: Mood Tap */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#24332F', marginBottom: '10px' }}>
          1. How is your overall feeling today?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* Good */}
          <button
            id="tap-mood-good"
            type="button"
            className={`tap-button ${mood === 5 ? 'active' : ''}`}
            onClick={() => setMood(5)}
            style={{
              borderColor: mood === 5 ? '#10B981' : '#E3E7DD',
              background: mood === 5 ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : '#FFFFFF',
              color: mood === 5 ? '#065F46' : '#24332F',
              boxShadow: mood === 5 ? '0 4px 14px rgba(16, 185, 129, 0.2)' : 'none',
              transform: mood === 5 ? 'translateY(-2px)' : 'none',
              padding: '14px 10px'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: mood === 5 ? '#10B981' : '#F2F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mood === 5 ? '#FFFFFF' : '#10B981', transition: 'all 0.2s' }}>
              <Smile size={22} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Good (5)</span>
            <span style={{ fontSize: '11px', color: mood === 5 ? '#047857' : '#84938B' }}>Energetic &amp; Clear</span>
          </button>

          {/* Okay */}
          <button
            id="tap-mood-okay"
            type="button"
            className={`tap-button ${mood === 3 ? 'active' : ''}`}
            onClick={() => setMood(3)}
            style={{
              borderColor: mood === 3 ? '#8B5CF6' : '#E3E7DD',
              background: mood === 3 ? 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' : '#FFFFFF',
              color: mood === 3 ? '#5B21B6' : '#24332F',
              boxShadow: mood === 3 ? '0 4px 14px rgba(139, 92, 246, 0.2)' : 'none',
              transform: mood === 3 ? 'translateY(-2px)' : 'none',
              padding: '14px 10px'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: mood === 3 ? '#8B5CF6' : '#F7F4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mood === 3 ? '#FFFFFF' : '#8B5CF6', transition: 'all 0.2s' }}>
              <Meh size={22} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Okay (3)</span>
            <span style={{ fontSize: '11px', color: mood === 3 ? '#6D28D9' : '#84938B' }}>Balanced &amp; Steady</span>
          </button>

          {/* Low */}
          <button
            id="tap-mood-low"
            type="button"
            className={`tap-button ${mood === 1 ? 'active' : ''}`}
            onClick={() => setMood(1)}
            style={{
              borderColor: mood === 1 ? '#F43F5E' : '#E3E7DD',
              background: mood === 1 ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)' : '#FFFFFF',
              color: mood === 1 ? '#9F1239' : '#24332F',
              boxShadow: mood === 1 ? '0 4px 14px rgba(244, 63, 94, 0.2)' : 'none',
              transform: mood === 1 ? 'translateY(-2px)' : 'none',
              padding: '14px 10px'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: mood === 1 ? '#F43F5E' : '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mood === 1 ? '#FFFFFF' : '#F43F5E', transition: 'all 0.2s' }}>
              <Frown size={22} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Low (1)</span>
            <span style={{ fontSize: '11px', color: mood === 1 ? '#BE123C' : '#84938B' }}>Fatigued / Heavy</span>
          </button>
        </div>
      </div>

      {/* Row 2: Stress Scale (1-5) Colour Spectrum */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#24332F' }}>
            2. Current Stress Pressure: <span style={{ color: stress <= 2 ? '#059669' : stress === 3 ? '#D97706' : '#DC2626', fontWeight: 800 }}>Level {stress} / 5</span>
          </label>
          <span style={{ fontSize: '12px', fontWeight: 600, color: stress <= 2 ? '#059669' : stress === 3 ? '#D97706' : '#DC2626' }}>
            {stress === 1 ? '🌊 Calm & Unburdened' : stress === 2 ? '🌱 Light & Easy' : stress === 3 ? '⚡ Moderate Load' : stress === 4 ? '🔥 Elevated Demand' : '🚨 Peak Overload'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {[
            { lvl: 1, label: 'Calm', color: '#06B6D4', bg: '#ECFEFF' },
            { lvl: 2, label: 'Light', color: '#10B981', bg: '#ECFDF5' },
            { lvl: 3, label: 'Med', color: '#F59E0B', bg: '#FFFBEB' },
            { lvl: 4, label: 'High', color: '#F97316', bg: '#FFF7ED' },
            { lvl: 5, label: 'Peak', color: '#F43F5E', bg: '#FFF1F2' }
          ].map(({ lvl, label, color, bg }) => (
            <button
              id={`tap-stress-${lvl}`}
              key={lvl}
              type="button"
              className={`tap-button ${stress === lvl ? 'active' : ''}`}
              onClick={() => setStress(lvl)}
              style={{
                padding: '12px 4px',
                background: stress === lvl ? color : '#FFFFFF',
                color: stress === lvl ? '#FFFFFF' : '#24332F',
                borderColor: stress === lvl ? color : '#E3E7DD',
                boxShadow: stress === lvl ? `0 4px 12px ${color}35` : 'none',
                transform: stress === lvl ? 'translateY(-2px)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 800 }}>{lvl}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: stress === lvl ? '#FFFFFF' : '#84938B' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Primary Factor */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#24332F', marginBottom: '8px' }}>
          3. Primary contributing factor today:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { name: 'Studies', icon: '📚', color: '#245B52', bg: '#DDE9DF' },
            { name: 'Sleep', icon: '🌙', color: '#6366F1', bg: '#EEF2FF' },
            { name: 'Screen', icon: '💻', color: '#0EA5E9', bg: '#E0F2FE' },
            { name: 'Social', icon: '👥', color: '#F59E0B', bg: '#FEF3C7' },
            { name: 'Personal', icon: '🧘', color: '#EC4899', bg: '#FCE7F3' },
            { name: 'Routine', icon: '⏱️', color: '#84938B', bg: '#F3F4F6' }
          ].map((f) => (
            <button
              id={`tap-factor-${f.name.toLowerCase()}`}
              key={f.name}
              type="button"
              onClick={() => setMainFactor(f.name)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: mainFactor === f.name ? `1.5px solid ${f.color}` : '1px solid #E3E7DD',
                background: mainFactor === f.name ? f.bg : '#FFFFFF',
                color: mainFactor === f.name ? f.color : '#24332F',
                boxShadow: mainFactor === f.name ? `0 2px 8px ${f.color}20` : 'none',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{f.icon}</span>
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: Question Budget Rotating Micro-Question */}
      {microQuestion && microQuestion.selected_question && (
        <div style={{
          background: 'linear-gradient(135deg, #FAF8FE 0%, #F5F2FC 100%)',
          border: '1px solid #E8E1F5',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="glow-pill-indigo" style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
              Rotating Micro-Question • {microQuestion.selected_question.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#63736B' }}>
              <Clock size={14} color="#6366F1" />
              <span>~5 seconds</span>
            </div>
          </div>

          <p style={{ fontSize: '14px', fontWeight: '700', color: '#24332F', marginBottom: '6px' }}>
            {microQuestion.selected_question.prompt}
          </p>

          <p style={{ fontSize: '12px', color: '#63736B', marginBottom: '14px', fontStyle: 'italic' }}>
            Context: {microQuestion.reason_asked}
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
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: microValue === opt.value ? '1.5px solid #6366F1' : '1px solid #E3E7DD',
                    background: microValue === opt.value ? '#EEF2FF' : '#FFFFFF',
                    color: microValue === opt.value ? '#4338CA' : '#24332F',
                    boxShadow: microValue === opt.value ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#24332F', fontWeight: 700 }}>Value: {microValue} {microQuestion.selected_question.unit}</span>
                <span style={{ fontSize: '12px', color: '#63736B' }}>Range: {microQuestion.selected_question.min} - {microQuestion.selected_question.max}</span>
              </div>
              <input
                type="range"
                min={microQuestion.selected_question.min || 0}
                max={microQuestion.selected_question.max || 12}
                step={microQuestion.selected_question.step || 0.5}
                value={microValue}
                onChange={(e) => setMicroValue(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#6366F1' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: '#63736B' }}>
          Takes ~25s • Never silently invents data
        </span>
        <button
          id="submit-checkin-btn"
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: '12px 24px', fontSize: '14px' }}
        >
          {loading ? 'Logging...' : (submitted ? 'Update Check-in' : 'Submit 25s Check-in')}
          <ChevronRight size={18} />
        </button>
      </div>

      {submittedMessage && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#059669', fontWeight: 600, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <CheckCircle2 size={16} />
          <span>{submittedMessage}</span>
        </div>
      )}
    </div>
  );
}

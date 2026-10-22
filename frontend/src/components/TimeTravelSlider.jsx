import React from 'react';
import { FastForward, Clock, Play, RotateCcw, Sparkles } from 'lucide-react';

export default function TimeTravelSlider({ availableDates, currentDate, onDateChange }) {
  if (!availableDates || availableDates.length <= 1) return null;

  const currentIndex = availableDates.indexOf(currentDate);
  const activeIdx = currentIndex !== -1 ? currentIndex : availableDates.length - 1;

  const currentWeek = Math.floor(activeIdx / 7) + 1;
  const dayInWeek = (activeIdx % 7) + 1;

  const handleSliderChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    const date = availableDates[idx];
    if (date && onDateChange) {
      onDateChange(date);
    }
  };

  const handleQuickJump = (weekNum) => {
    const targetIdx = Math.min((weekNum - 1) * 7 + 3, availableDates.length - 1);
    if (onDateChange && availableDates[targetIdx]) {
      onDateChange(availableDates[targetIdx]);
    }
  };

  return (
    <div className="drift-card card-accent-teal" id="time-travel-slider-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0D9488',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)'
          }}>
            <FastForward size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="glow-pill glow-pill-teal">Time-Travel Simulator</span>
              <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600 }}>Interactive Demo Controls</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              Longitudinal Simulation Engine
            </h3>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #E6FFFA 100%)',
          border: '1px solid #99F6E4',
          padding: '6px 14px',
          borderRadius: '12px',
          textAlign: 'right'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0D9488', display: 'block' }}>
            Week {currentWeek} • Day {activeIdx + 1}
          </span>
          <div style={{ fontSize: '11px', color: '#63736B', fontWeight: 500 }}>
            {currentDate}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <input
          id="time-travel-range"
          type="range"
          min={0}
          max={availableDates.length - 1}
          value={activeIdx}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '8px',
            accentColor: '#0D9488',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#63736B', marginTop: '6px', fontWeight: 600 }}>
          <span>Day 1 (Baseline Calibration)</span>
          <span>Week 3 (Stable)</span>
          <span>Week 5 (Quiet Drift)</span>
          <span>Week 6 (Academic Peak)</span>
          <span>Latest Record</span>
        </div>
      </div>

      {/* Colour-coded quick jump scenario shortcuts */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '11.5px', color: '#63736B', fontWeight: 700, marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Simulation Jumps:
        </span>
        <button
          type="button"
          onClick={() => handleQuickJump(2)}
          style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          ● Week 2 (Balanced Normal)
        </button>
        <button
          type="button"
          onClick={() => handleQuickJump(4)}
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            color: '#92400E',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          ● Week 4 (Sleep Drift Starts)
        </button>
        <button
          type="button"
          onClick={() => handleQuickJump(5)}
          style={{
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
            border: '1px solid #FECDD3',
            color: '#9F1239',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          ● Week 5 (CUSUM Drift Active)
        </button>
        <button
          type="button"
          onClick={() => handleQuickJump(6)}
          style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            border: '1px solid #C7D2FE',
            color: '#3730A3',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          ● Week 6 (Exam Overload)
        </button>
        <button
          type="button"
          onClick={() => onDateChange(availableDates[availableDates.length - 1])}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #0D9488',
            color: '#0D9488',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '14px',
            cursor: 'pointer',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RotateCcw size={12} />
          Reset to Latest
        </button>
      </div>
    </div>
  );
}


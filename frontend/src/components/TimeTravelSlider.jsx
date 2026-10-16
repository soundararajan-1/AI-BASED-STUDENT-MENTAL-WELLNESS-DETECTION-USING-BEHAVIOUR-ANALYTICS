import React from 'react';
import { FastForward, Clock, Play, RotateCcw } from 'lucide-react';

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
    <div className="drift-card" id="time-travel-slider-card" style={{ marginBottom: '24px', background: 'rgba(15, 23, 42, 0.85)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(20, 184, 166, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: '#2dd4bf'
          }}>
            <FastForward size={18} />
          </div>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '2px' }}>Interactive Demo Slider</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Time-Travel Simulation</h3>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#2dd4bf' }}>
            Week {currentWeek} (Day {activeIdx + 1})
          </span>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
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
            accentColor: '#14b8a6',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          <span>Day 1 (Baseline Start)</span>
          <span>Week 3 (Stable)</span>
          <span>Week 5 (Quiet Drift)</span>
          <span>Week 6 (Academic Peak)</span>
          <span>Today</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '4px' }}>Demo Shortcuts:</span>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '4px 10px' }}
          onClick={() => handleQuickJump(2)}
        >
          Week 2 (Stable Normal)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '4px 10px', borderColor: 'rgba(20, 184, 166, 0.4)' }}
          onClick={() => handleQuickJump(4)}
        >
          Week 4 (Sleep Drift Starts)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '4px 10px', borderColor: 'rgba(245, 158, 11, 0.5)' }}
          onClick={() => handleQuickJump(5)}
        >
          Week 5 (Drift Alert Active)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '4px 10px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
          onClick={() => handleQuickJump(6)}
        >
          Week 6 (Workload Pattern)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '4px 10px', marginLeft: 'auto' }}
          onClick={() => onDateChange(availableDates[availableDates.length - 1])}
        >
          <RotateCcw size={12} style={{ marginRight: '4px' }} />
          Reset to Latest
        </button>
      </div>
    </div>
  );
}

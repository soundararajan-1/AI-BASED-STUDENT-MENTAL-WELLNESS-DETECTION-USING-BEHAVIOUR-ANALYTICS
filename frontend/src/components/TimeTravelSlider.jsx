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
    <div className="drift-card" id="time-travel-slider-card" style={{ marginBottom: '24px', background: '#FFFFFF', border: '1px solid #E3E7DD' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: '#DDE9DF',
            padding: '6px',
            borderRadius: '8px',
            color: '#245B52'
          }}>
            <FastForward size={18} />
          </div>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '2px' }}>Interactive Demo Slider</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#24332F' }}>Time-Travel Simulation</h3>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#245B52' }}>
            Week {currentWeek} (Day {activeIdx + 1})
          </span>
          <div style={{ fontSize: '11px', color: '#63736B' }}>
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
            accentColor: '#245B52',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#63736B', marginTop: '6px' }}>
          <span>Day 1 (Baseline Start)</span>
          <span>Week 3 (Stable)</span>
          <span>Week 5 (Quiet Drift)</span>
          <span>Week 6 (Academic Peak)</span>
          <span>Today</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#63736B', marginRight: '4px' }}>Demo Shortcuts:</span>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '5px 10px' }}
          onClick={() => handleQuickJump(2)}
        >
          Week 2 (Stable Normal)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#CBD4C2' }}
          onClick={() => handleQuickJump(4)}
        >
          Week 4 (Sleep Drift Starts)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#E9B9A9', color: '#8B2C1F' }}
          onClick={() => handleQuickJump(5)}
        >
          Week 5 (Drift Alert Active)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#D5C8EA', color: '#4C3B70' }}
          onClick={() => handleQuickJump(6)}
        >
          Week 6 (Workload Pattern)
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '5px 10px', marginLeft: 'auto' }}
          onClick={() => onDateChange(availableDates[availableDates.length - 1])}
        >
          <RotateCcw size={12} style={{ marginRight: '4px' }} />
          Reset to Latest
        </button>
      </div>
    </div>
  );
}

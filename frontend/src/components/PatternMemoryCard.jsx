import React from 'react';
import { History, GitCommit, Check, Sparkles, Compass } from 'lucide-react';

export default function PatternMemoryCard({ memoryData }) {
  if (!memoryData || !memoryData.has_memory) {
    return null;
  }

  const { summary, closest_week, distance, similar_metrics } = memoryData;

  const metricColors = {
    sleep: { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' },
    stress: { bg: '#FFE4E6', border: '#FDA4AF', text: '#9F1239' },
    study: { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
    screen: { bg: '#EDE9FE', border: '#DDD6FE', text: '#5B21B6' },
    social: { bg: '#CCFBF1', border: '#99F6E4', text: '#115E59' }
  };

  return (
    <div className="drift-card card-accent-indigo" id="pattern-memory-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7C3AED',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
          }}>
            <History size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="glow-pill glow-pill-indigo">Vector Space Memory</span>
              <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600 }}>Euclidean Distance: {distance}</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              Historical Habit Resemblance
            </h3>
          </div>
        </div>

        {closest_week && (
          <div style={{
            background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
            border: '1px solid #C4B5FD',
            color: '#6D28D9',
            padding: '5px 12px',
            borderRadius: '16px',
            fontSize: '11.5px',
            fontWeight: '700'
          }}>
            Closest Match: {typeof closest_week === 'object' ? (closest_week.label || `Week ${closest_week.week}`) : `Week ${closest_week}`}
          </div>
        )}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: '1px solid #DDD6FE',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '13.5px',
        color: '#24332F',
        lineHeight: '1.5',
        marginBottom: '12px',
        fontWeight: 500,
        boxShadow: '0 2px 6px rgba(109, 40, 217, 0.03)'
      }}>
        {summary}
      </div>

      {similar_metrics && similar_metrics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#63736B' }}>
          <span style={{ fontWeight: 600, color: '#4A5B53' }}>Aligned behavioral axes:</span>
          {similar_metrics.map((m) => {
            const styling = metricColors[m.toLowerCase()] || { bg: '#F6F5EF', border: '#E3E7DD', text: '#24332F' };
            return (
              <span
                key={m}
                style={{
                  background: styling.bg,
                  border: `1px solid ${styling.border}`,
                  color: styling.text,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '11px',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Check size={11} /> {m}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}


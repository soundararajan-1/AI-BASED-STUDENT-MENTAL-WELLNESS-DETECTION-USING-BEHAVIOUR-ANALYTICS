import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Calendar } from 'lucide-react';

export default function TimelineCard({ timelineWeeks }) {
  const [activeMetric, setActiveMetric] = useState('all');

  if (!timelineWeeks || timelineWeeks.length === 0) {
    return null;
  }

  const colors = {
    sleep: '#245B52',
    study: '#4C3B70',
    stress: '#8B2C1F',
    mood: '#3A6B56',
    screen: '#6A538F',
    social: '#2D6E63'
  };

  return (
    <div className="drift-card" id="timeline-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Longitudinal Trajectory</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>Weekly Progression Across Metrics</h3>
        </div>

        {/* Metric filter buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'sleep', 'stress', 'study', 'mood'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMetric(m)}
              style={{
                background: activeMetric === m ? '#DDE9DF' : '#FFFFFF',
                border: activeMetric === m ? '1.5px solid #245B52' : '1px solid #E3E7DD',
                color: activeMetric === m ? '#245B52' : '#63736B',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineWeeks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E3E7DD" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#63736B', fontSize: 11 }} />
            <YAxis tick={{ fill: '#63736B', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid #E3E7DD',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#24332F',
                      boxShadow: '0 4px 16px rgba(36, 51, 47, 0.08)'
                    }}>
                      <p style={{ fontWeight: '700', marginBottom: '6px', color: '#245B52' }}>{label}</p>
                      {payload.map((p) => (
                        <p key={p.name} style={{ color: p.color, fontSize: '11px', fontWeight: 500 }}>
                          {p.name}: {p.value !== null ? p.value : 'N/A'}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#63736B', paddingTop: '10px' }} />

            {(activeMetric === 'all' || activeMetric === 'sleep') && (
              <Line type="monotone" dataKey="sleep" name="Sleep (h)" stroke={colors.sleep} strokeWidth={2.5} dot={{ r: 3 }} />
            )}
            {(activeMetric === 'all' || activeMetric === 'stress') && (
              <Line type="monotone" dataKey="stress" name="Stress (1-5)" stroke={colors.stress} strokeWidth={2} dot={{ r: 3 }} />
            )}
            {(activeMetric === 'all' || activeMetric === 'study') && (
              <Line type="monotone" dataKey="study" name="Study (h)" stroke={colors.study} strokeWidth={2} dot={{ r: 3 }} />
            )}
            {(activeMetric === 'all' || activeMetric === 'mood') && (
              <Line type="monotone" dataKey="mood" name="Mood (1-5)" stroke={colors.mood} strokeWidth={2} dot={{ r: 3 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

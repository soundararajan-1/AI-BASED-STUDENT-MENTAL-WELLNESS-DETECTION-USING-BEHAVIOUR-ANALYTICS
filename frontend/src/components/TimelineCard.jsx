import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Calendar } from 'lucide-react';

export default function TimelineCard({ timelineWeeks }) {
  const [activeMetric, setActiveMetric] = useState('all');

  if (!timelineWeeks || timelineWeeks.length === 0) {
    return null;
  }

  const colors = {
    sleep: '#2dd4bf',
    study: '#6366f1',
    stress: '#f43f5e',
    mood: '#f59e0b',
    screen: '#ec4899',
    social: '#3b82f6'
  };

  return (
    <div className="drift-card" id="timeline-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Longitudinal Trajectory</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Weekly Progression Across Metrics</h3>
        </div>

        {/* Metric filter buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'sleep', 'stress', 'study', 'mood'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMetric(m)}
              style={{
                background: activeMetric === m ? 'rgba(20, 184, 166, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeMetric === m ? '1px solid #14b8a6' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeMetric === m ? '#2dd4bf' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
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
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                    }}>
                      <p style={{ fontWeight: '700', marginBottom: '6px', color: '#2dd4bf' }}>{label}</p>
                      {payload.map((p) => (
                        <p key={p.name} style={{ color: p.color, fontSize: '11px' }}>
                          {p.name}: {p.value !== null ? p.value : 'N/A'}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />

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

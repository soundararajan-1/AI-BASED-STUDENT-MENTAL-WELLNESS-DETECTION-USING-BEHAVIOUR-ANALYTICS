import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Calendar, TrendingUp, Layers } from 'lucide-react';

export default function TimelineCard({ timelineWeeks }) {
  const [activeMetric, setActiveMetric] = useState('all');

  if (!timelineWeeks || timelineWeeks.length === 0) {
    return null;
  }

  const metricMeta = {
    all: { label: 'All Trajectories', color: '#0D9488', bg: 'linear-gradient(135deg, #0D9488 0%, #115E59 100%)' },
    sleep: { label: 'Sleep Duration', color: '#10B981', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    stress: { label: 'Perceived Stress', color: '#F43F5E', bg: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)' },
    study: { label: 'Study Volume', color: '#6366F1', bg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' },
    mood: { label: 'Self-Report Mood', color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }
  };

  return (
    <div className="drift-card card-accent-teal" id="timeline-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
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
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="glow-pill glow-pill-teal">Longitudinal Radar</span>
              <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600 }}>Multi-Week Trend Analysis</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              Weekly Progression Across Metrics
            </h3>
          </div>
        </div>

        {/* Colourful Metric filter buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'sleep', 'stress', 'study', 'mood'].map((m) => {
            const isSelected = activeMetric === m;
            const meta = metricMeta[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMetric(m)}
                style={{
                  background: isSelected ? meta.bg : '#FFFFFF',
                  border: isSelected ? 'none' : '1px solid #E3E7DD',
                  color: isSelected ? '#FFFFFF' : '#63736B',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? '#FFFFFF' : meta.color
                  }}
                />
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: '100%', height: '290px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineWeeks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E3E7DD" strokeDasharray="3 3" opacity={0.7} />
            <XAxis dataKey="label" tick={{ fill: '#63736B', fontSize: 11, fontWeight: 500 }} />
            <YAxis tick={{ fill: '#63736B', fontSize: 11, fontWeight: 500 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.96)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #CBD4C2',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#24332F',
                      boxShadow: '0 8px 24px rgba(36, 51, 47, 0.12)'
                    }}>
                      <p style={{ fontWeight: '800', marginBottom: '8px', color: '#245B52', fontSize: '13px' }}>{label}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {payload.map((p) => (
                          <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#63736B', fontSize: '11px', fontWeight: 600 }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                              {p.name}
                            </span>
                            <strong style={{ color: p.color, fontSize: '12px' }}>
                              {p.value !== null ? p.value : 'N/A'}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11.5px', color: '#63736B', paddingTop: '10px', fontWeight: 600 }}
              iconType="circle"
            />

            {(activeMetric === 'all' || activeMetric === 'sleep') && (
              <Line
                type="monotone"
                dataKey="sleep"
                name="Sleep (hrs)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
            {(activeMetric === 'all' || activeMetric === 'stress') && (
              <Line
                type="monotone"
                dataKey="stress"
                name="Stress (1-5)"
                stroke="#F43F5E"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#F43F5E', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#E11D48', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
            {(activeMetric === 'all' || activeMetric === 'study') && (
              <Line
                type="monotone"
                dataKey="study"
                name="Study (hrs)"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
            {(activeMetric === 'all' || activeMetric === 'mood') && (
              <Line
                type="monotone"
                dataKey="mood"
                name="Mood (1-5)"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


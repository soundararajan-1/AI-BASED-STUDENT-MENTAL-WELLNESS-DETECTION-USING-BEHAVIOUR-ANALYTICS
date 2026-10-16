import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { Target, Activity } from 'lucide-react';

export default function FingerprintRadar({ radarData }) {
  if (!radarData || radarData.length === 0) {
    return (
      <div className="drift-card" style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Awaiting enough check-ins to build fingerprint radar.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '12px',
          color: '#f8fafc',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
        }}>
          <p style={{ fontWeight: '700', marginBottom: '6px', color: '#2dd4bf' }}>{data.metric}</p>
          <p style={{ color: '#a5b4fc' }}>Recent Value: {data.raw_recent}</p>
          <p style={{ color: '#2dd4bf' }}>Personal Baseline Median: {data.raw_median}</p>
          <p style={{ color: '#94a3b8' }}>Last Week Ghost: {data.raw_ghost}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="drift-card" id="fingerprint-radar-card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Behavioral Fingerprint</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>7-Axis Personal Normal vs Today</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
          <Target size={16} color="#2dd4bf" />
          <span>Learned Normal Band</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            
            {/* Ghost overlay: Last Week */}
            <Radar
              name="Last Week (Ghost)"
              dataKey="last_week"
              stroke="#64748b"
              fill="#64748b"
              fillOpacity={0.12}
              strokeDasharray="4 4"
            />
            
            {/* Personal Normal Baseline */}
            <Radar
              name="Personal Baseline"
              dataKey="baseline"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.25}
              strokeWidth={2}
            />

            {/* Current / Today */}
            <Radar
              name="Recent / Today"
              dataKey="current"
              stroke="#818cf8"
              fill="#6366f1"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#94a3b8' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

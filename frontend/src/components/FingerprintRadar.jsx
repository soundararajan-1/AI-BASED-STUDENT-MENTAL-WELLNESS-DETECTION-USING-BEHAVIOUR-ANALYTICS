import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { Target, Activity } from 'lucide-react';

export default function FingerprintRadar({ radarData }) {
  if (!radarData || radarData.length === 0) {
    return (
      <div className="drift-card" style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#63736B' }}>Awaiting enough check-ins to build fingerprint radar.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E3E7DD',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '12px',
          color: '#24332F',
          boxShadow: '0 4px 16px rgba(36, 51, 47, 0.08)'
        }}>
          <p style={{ fontWeight: '700', marginBottom: '6px', color: '#245B52' }}>{data.metric}</p>
          <p style={{ color: '#4C3B70', fontWeight: 500 }}>Recent Value: {data.raw_recent}</p>
          <p style={{ color: '#245B52', fontWeight: 500 }}>Personal Baseline Median: {data.raw_median}</p>
          <p style={{ color: '#63736B' }}>Last Week Ghost: {data.raw_ghost}</p>
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
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>7-Axis Personal Normal vs Today</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#63736B' }}>
          <Target size={16} color="#245B52" />
          <span>Learned Normal Band</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#E3E7DD" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#24332F', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            
            {/* Ghost overlay: Last Week */}
            <Radar
              name="Last Week (Ghost)"
              dataKey="last_week"
              stroke="#A8B5A5"
              fill="#DDE9DF"
              fillOpacity={0.3}
              strokeDasharray="4 4"
            />
            
            {/* Personal Normal Baseline */}
            <Radar
              name="Personal Baseline"
              dataKey="baseline"
              stroke="#245B52"
              fill="#245B52"
              fillOpacity={0.2}
              strokeWidth={2}
            />

            {/* Current / Today */}
            <Radar
              name="Recent / Today"
              dataKey="current"
              stroke="#7B62A4"
              fill="#E8E1F5"
              fillOpacity={0.45}
              strokeWidth={2}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#63736B' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

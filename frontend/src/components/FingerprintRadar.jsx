import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { Target, Activity } from 'lucide-react';

export default function FingerprintRadar({ radarData }) {
  if (!radarData || radarData.length === 0) {
    return (
      <div className="drift-card card-accent-indigo" style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#63736B' }}>Awaiting enough check-ins to build fingerprint radar.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #E3E7DD',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#24332F',
          boxShadow: '0 8px 24px rgba(36, 51, 47, 0.1)'
        }}>
          <p style={{ fontWeight: '800', marginBottom: '6px', color: '#6366F1', fontSize: '13px' }}>{data.metric}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7C3AED', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }} />
            <span>Recent Value: {data.raw_recent}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0D9488', fontWeight: 600, marginTop: '3px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0D9488' }} />
            <span>Baseline Median: {data.raw_median}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', marginTop: '3px', fontSize: '11px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
            <span>Last Week Ghost: {data.raw_ghost}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="drift-card card-accent-indigo" id="fingerprint-radar-card" style={{ height: '440px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <span className="glow-pill-indigo" style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, marginBottom: '6px', display: 'inline-block' }}>
            Behavioral Fingerprint (7 Axes)
          </span>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#24332F', letterSpacing: '-0.3px' }}>
            Personal Normal vs Current Snapshot
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0D9488', fontWeight: 600 }}>
          <Target size={16} color="#0D9488" />
          <span>Learned Normal Band</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '320px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#E3E7DD" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#24332F', fontSize: 11, fontWeight: 700 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            
            {/* Ghost overlay: Last Week */}
            <Radar
              name="Last Week (Ghost)"
              dataKey="last_week"
              stroke="#F59E0B"
              fill="#FDE68A"
              fillOpacity={0.25}
              strokeDasharray="4 4"
            />
            
            {/* Personal Normal Baseline */}
            <Radar
              name="Personal Baseline"
              dataKey="baseline"
              stroke="#0D9488"
              fill="#10B981"
              fillOpacity={0.28}
              strokeWidth={2.5}
            />

            {/* Current / Today */}
            <Radar
              name="Recent / Today"
              dataKey="current"
              stroke="#8B5CF6"
              fill="#C4B5FD"
              fillOpacity={0.5}
              strokeWidth={2.5}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 600 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

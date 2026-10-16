import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

export default function QuietDriftCard({ driftData }) {
  if (!driftData) return null;

  const { has_drift, primary_drift, all_drifts, summary } = driftData;
  const activeDrift = primary_drift || (all_drifts && all_drifts.sleep) || null;
  const series = activeDrift?.series || [];

  // Filter series to display clean downsampled points if long
  const displayPoints = series.length > 25 ? series.slice(-25) : series;

  return (
    <div className={`drift-card ${has_drift ? 'drift-card-glow' : ''}`} id="quiet-drift-card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span className={`badge ${has_drift ? 'badge-warning' : 'badge-teal'}`} style={{ marginBottom: '4px' }}>
            {has_drift ? 'Quiet Drift Alert (CUSUM)' : 'Quiet Drift Monitor'}
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
            Cumulative Deviation Tracking (k=0.5, h=4.0)
          </h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: has_drift ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: has_drift ? '#fbbf24' : '#34d399',
          border: has_drift ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {has_drift ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          <span>{has_drift ? 'Drift Flag Active' : 'Stable Trajectory'}</span>
        </div>
      </div>

      <div style={{
        background: has_drift ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        border: has_drift ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#f1f5f9',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {has_drift ? <TrendingDown size={18} color="#f59e0b" /> : <CheckCircle2 size={18} color="#14b8a6" />}
        <span>{summary}</span>
      </div>

      <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(v) => v ? v.slice(5) : ''}
            />
            <YAxis
              domain={[0, 8]}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}>
                      <p style={{ fontWeight: '700', color: '#2dd4bf' }}>{d.date}</p>
                      <p>Sleep: {d.value}h</p>
                      <p style={{ color: d.cusum >= 4.0 ? '#f59e0b' : '#38bdf8' }}>
                        CUSUM Accumulator: {d.cusum} / 4.0
                      </p>
                      {d.flagged && <p style={{ color: '#f43f5e', fontWeight: '700' }}>Flag Triggered</p>}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={4.0}
              label={{ value: "Alert Threshold (h=4.0)", fill: "#f59e0b", fontSize: 10, position: "top" }}
              stroke="#f59e0b"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="cusum"
              name="Accumulated Drift (S_t)"
              stroke="#2dd4bf"
              strokeWidth={2.5}
              dot={{ fill: '#2dd4bf', r: 3 }}
              activeDot={{ r: 6, fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
        Uses a frozen 14-day initial reference so subtle declines are never absorbed into your baseline.
      </div>
    </div>
  );
}

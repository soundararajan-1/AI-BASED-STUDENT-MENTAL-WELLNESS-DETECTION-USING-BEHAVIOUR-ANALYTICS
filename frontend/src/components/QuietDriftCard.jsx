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
    <div className="drift-card" id="quiet-drift-card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span className={`badge ${has_drift ? 'badge-warning' : 'badge-teal'}`} style={{ marginBottom: '4px' }}>
            {has_drift ? 'Quiet Drift Alert (CUSUM)' : 'Quiet Drift Monitor'}
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>
            Cumulative Deviation Tracking (k=0.5, h=4.0)
          </h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: has_drift ? '#E9B9A9' : '#DDE9DF',
          color: has_drift ? '#8B2C1F' : '#245B52',
          border: has_drift ? '1px solid #D9A291' : '1px solid #CBD4C2',
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
        background: has_drift ? '#FFF8F6' : '#FAFBF9',
        border: has_drift ? '1px solid #E9B9A9' : '1px solid #E3E7DD',
        borderRadius: '10px',
        padding: '12px 14px',
        fontSize: '13px',
        color: '#24332F',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {has_drift ? <TrendingDown size={18} color="#C85A48" /> : <CheckCircle2 size={18} color="#245B52" />}
        <span>{summary}</span>
      </div>

      <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E3E7DD" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#63736B', fontSize: 10 }}
              tickFormatter={(v) => v ? v.slice(5) : ''}
            />
            <YAxis
              domain={[0, 8]}
              tick={{ fill: '#63736B', fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
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
                      <p style={{ fontWeight: '700', color: '#245B52' }}>{d.date}</p>
                      <p style={{ color: '#63736B' }}>Sleep: {d.value}h</p>
                      <p style={{ color: d.cusum >= 4.0 ? '#8B2C1F' : '#245B52', fontWeight: 600 }}>
                        CUSUM Accumulator: {d.cusum} / 4.0
                      </p>
                      {d.flagged && <p style={{ color: '#8B2C1F', fontWeight: '700' }}>Threshold Crossed</p>}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={4.0}
              label={{ value: "Alert Threshold (h=4.0)", fill: "#8B2C1F", fontSize: 10, position: "top" }}
              stroke="#C85A48"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="cusum"
              name="Accumulated Drift (S_t)"
              stroke="#245B52"
              strokeWidth={2.5}
              dot={{ fill: '#245B52', r: 3 }}
              activeDot={{ r: 6, fill: '#C85A48' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '8px', fontSize: '11px', color: '#63736B', textAlign: 'center' }}>
        Uses a frozen 14-day initial reference so subtle declines are never absorbed into your baseline.
      </div>
    </div>
  );
}

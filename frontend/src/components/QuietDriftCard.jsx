import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingDown, Activity, Sparkles } from 'lucide-react';

export default function QuietDriftCard({ driftData }) {
  if (!driftData) return null;

  const { has_drift, primary_drift, all_drifts, summary } = driftData;
  const activeDrift = primary_drift || (all_drifts && all_drifts.sleep) || null;
  const series = activeDrift?.series || [];

  // Filter series to display clean downsampled points if long
  const displayPoints = series.length > 25 ? series.slice(-25) : series;

  const latestPoint = displayPoints[displayPoints.length - 1] || { cusum: 0, value: 0 };
  const cusumVal = Number(latestPoint.cusum || 0).toFixed(2);

  return (
    <div className={`drift-card ${has_drift ? 'card-accent-coral' : 'card-accent-teal'}`} id="quiet-drift-card" style={{ height: '440px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: has_drift ? 'linear-gradient(135deg, #FEE2E2 0%, #FECDD3 100%)' : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: has_drift ? '#E11D48' : '#0D9488',
            boxShadow: has_drift ? '0 4px 12px rgba(225, 29, 72, 0.15)' : '0 4px 12px rgba(13, 148, 136, 0.15)'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span className={`glow-pill ${has_drift ? 'glow-pill-coral' : 'glow-pill-teal'}`}>
                {has_drift ? 'CUSUM Drift Alert' : 'Continuous Trajectory Sensor'}
              </span>
              <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600 }}>k=0.5, h=4.0</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              Cumulative Deviation (Subtle Drift)
            </h3>
          </div>
        </div>

        {/* Live Status Pill with pulsing dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: has_drift ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          color: has_drift ? '#BE123C' : '#047857',
          border: has_drift ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <span className={`status-dot ${has_drift ? 'status-dot-coral' : 'status-dot-emerald'}`} />
          <span>{has_drift ? 'Drift Flagged' : 'Stable Band'}</span>
        </div>
      </div>

      {/* Numerical Quick Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(246, 245, 239, 0.8) 0%, #FFFFFF 100%)',
          border: '1px solid #E3E7DD',
          borderRadius: '10px',
          padding: '8px 12px'
        }}>
          <div style={{ fontSize: '10px', color: '#63736B', textTransform: 'uppercase', fontWeight: 700 }}>Accumulator S_t</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: has_drift ? '#E11D48' : '#0D9488' }}>
            {cusumVal} <span style={{ fontSize: '11px', fontWeight: 500, color: '#63736B' }}>/ 4.0</span>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(246, 245, 239, 0.8) 0%, #FFFFFF 100%)',
          border: '1px solid #E3E7DD',
          borderRadius: '10px',
          padding: '8px 12px'
        }}>
          <div style={{ fontSize: '10px', color: '#63736B', textTransform: 'uppercase', fontWeight: 700 }}>Safety Margin</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#245B52' }}>
            {Math.max(0, 4.0 - Number(cusumVal)).toFixed(2)} <span style={{ fontSize: '11px', fontWeight: 500, color: '#63736B' }}>to limit</span>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(246, 245, 239, 0.8) 0%, #FFFFFF 100%)',
          border: '1px solid #E3E7DD',
          borderRadius: '10px',
          padding: '8px 12px'
        }}>
          <div style={{ fontSize: '10px', color: '#63736B', textTransform: 'uppercase', fontWeight: 700 }}>Drift Target</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#6366F1' }}>
            Sleep Duration <span style={{ fontSize: '11px', fontWeight: 500, color: '#63736B' }}>(Hours)</span>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div style={{
        background: has_drift ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
        border: has_drift ? '1px solid #FECDD3' : '1px solid #A7F3D0',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '12.5px',
        color: has_drift ? '#9F1239' : '#065F46',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {has_drift ? <TrendingDown size={18} color="#E11D48" style={{ flexShrink: 0 }} /> : <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />}
        <span style={{ fontWeight: 600, lineHeight: 1.4 }}>{summary}</span>
      </div>

      {/* Chart Area */}
      <div style={{ flex: 1, width: '100%', minHeight: '190px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cusumAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={has_drift ? '#F43F5E' : '#0D9488'} stopOpacity={0.45} />
                <stop offset="60%" stopColor={has_drift ? '#F59E0B' : '#10B981'} stopOpacity={0.15} />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E3E7DD" strokeDasharray="3 3" opacity={0.7} />
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
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #CBD4C2',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#24332F',
                      boxShadow: '0 8px 24px rgba(36, 51, 47, 0.12)'
                    }}>
                      <p style={{ fontWeight: '800', color: '#245B52', margin: '0 0 4px 0' }}>{d.date}</p>
                      <p style={{ color: '#63736B', margin: '0 0 2px 0' }}>Actual Sleep: <strong>{d.value}h</strong></p>
                      <p style={{ color: d.cusum >= 4.0 ? '#E11D48' : '#0D9488', fontWeight: 700, margin: '0 0 2px 0' }}>
                        CUSUM Accumulator: {Number(d.cusum).toFixed(2)} / 4.0
                      </p>
                      {d.flagged && (
                        <p style={{ color: '#E11D48', fontWeight: '800', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Threshold Exceeded
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={4.0}
              label={{ value: "Alert Threshold (h=4.0)", fill: "#E11D48", fontSize: 10, position: "top", fontWeight: 700 }}
              stroke="#F43F5E"
              strokeDasharray="4 4"
              strokeWidth={1.8}
            />
            <Area
              type="monotone"
              dataKey="cusum"
              name="Accumulated Drift (S_t)"
              stroke={has_drift ? '#E11D48' : '#0D9488'}
              strokeWidth={3}
              fill="url(#cusumAreaGradient)"
              dot={{ fill: has_drift ? '#E11D48' : '#0D9488', r: 3 }}
              activeDot={{ r: 6, fill: '#F59E0B', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Explanatory Footer */}
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#63736B', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Sparkles size={12} color="#0D9488" />
        <span>Frozen 14-day reference protects subtle gradual shifts from being absorbed into your baseline.</span>
      </div>
    </div>
  );
}


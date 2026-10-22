import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Zap, Info } from 'lucide-react';

export default function WhatChangedCard({ whatChanged }) {
  if (!whatChanged || !whatChanged.changes) {
    return null;
  }

  const { changes, headline, meaningful_count } = whatChanged;

  return (
    <div className="drift-card card-accent-coral" id="what-changed-card" style={{ height: '440px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span className="glow-pill-coral" style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, marginBottom: '6px', display: 'inline-block' }}>
            Shift Analysis (Signed Deltas)
          </span>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#24332F', letterSpacing: '-0.3px' }}>
            What Changed? (7d vs Prior 14d)
          </h3>
        </div>
        {meaningful_count > 0 && (
          <span className="glow-pill-coral" style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            {meaningful_count} Meaningful {meaningful_count === 1 ? 'Shift' : 'Shifts'}
          </span>
        )}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #FAFBF9 0%, #F5F7F3 100%)',
        borderRadius: '12px',
        padding: '12px 14px',
        fontSize: '13px',
        color: '#24332F',
        border: '1px solid #E3E7DD',
        borderLeft: '4px solid #F43F5E',
        marginBottom: '14px',
        fontWeight: '600',
        lineHeight: 1.5
      }}>
        {headline}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {changes.map((item) => {
          const isUp = item.delta > 0;
          const isSteady = Math.abs(item.delta) <= 0.05;
          
          // Determine if positive or negative shift
          const isPositiveShift = (item.metric === 'sleep' && isUp) || (item.metric === 'stress' && !isUp) || (item.metric === 'mood' && isUp);
          const iconColor = item.is_meaningful
            ? (isPositiveShift ? '#10B981' : '#F43F5E')
            : (isSteady ? '#63736B' : (isPositiveShift ? '#059669' : '#E11D48'));
          
          const iconBg = item.is_meaningful
            ? (isPositiveShift ? '#ECFDF5' : '#FFF1F2')
            : '#FAFBF9';

          return (
            <div
              key={item.metric}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: item.is_meaningful ? '#FFFDFD' : '#FFFFFF',
                border: item.is_meaningful ? '1px solid #FECDD3' : '1px solid #E3E7DD',
                boxShadow: item.is_meaningful ? '0 2px 8px rgba(244, 63, 94, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: iconBg,
                  color: iconColor,
                  fontWeight: 800,
                  boxShadow: item.is_meaningful ? `0 2px 6px ${iconColor}25` : 'none'
                }}>
                  {isSteady ? (
                    <ArrowRight size={16} />
                  ) : isUp ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#24332F', textTransform: 'capitalize' }}>
                    {item.metric}
                  </span>
                  <div style={{ fontSize: '11px', color: '#63736B' }}>
                    7d Mean: <strong>{item.recent_mean}</strong> • Baseline: {item.prev_mean}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: item.is_meaningful ? iconColor : '#24332F',
                  background: item.is_meaningful ? iconBg : 'transparent',
                  padding: item.is_meaningful ? '2px 8px' : '0',
                  borderRadius: '6px'
                }}>
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </span>
                {item.is_meaningful && (
                  <div style={{ fontSize: '10px', color: iconColor, fontWeight: '700', marginTop: '2px' }}>
                    Shift &gt; 0.5σ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

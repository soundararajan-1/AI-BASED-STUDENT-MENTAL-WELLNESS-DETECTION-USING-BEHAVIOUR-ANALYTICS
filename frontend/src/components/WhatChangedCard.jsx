import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Zap, Info } from 'lucide-react';

export default function WhatChangedCard({ whatChanged }) {
  if (!whatChanged || !whatChanged.changes) {
    return null;
  }

  const { changes, headline, meaningful_count } = whatChanged;

  return (
    <div className="drift-card" id="what-changed-card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span className="badge badge-teal" style={{ marginBottom: '4px' }}>Shift Analysis</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>What Changed? (7d vs Prior 14d)</h3>
        </div>
        {meaningful_count > 0 && (
          <span style={{
            background: '#E8E1F5',
            border: '1px solid #D5C8EA',
            color: '#4C3B70',
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            {meaningful_count} Meaningful {meaningful_count === 1 ? 'Shift' : 'Shifts'}
          </span>
        )}
      </div>

      <div style={{
        background: '#FAFBF9',
        borderRadius: '10px',
        padding: '12px 14px',
        fontSize: '13px',
        color: '#24332F',
        border: '1px solid #E3E7DD',
        borderLeft: '3px solid #245B52',
        marginBottom: '14px',
        fontWeight: '500'
      }}>
        {headline}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {changes.map((item) => {
          const isUp = item.delta > 0;
          const isSteady = Math.abs(item.delta) <= 0.05;
          const iconColor = item.is_meaningful
            ? (item.metric === 'stress' ? '#8B2C1F' : (item.metric === 'sleep' ? '#8B2C1F' : '#245B52'))
            : '#63736B';

          return (
            <div
              key={item.metric}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: item.is_meaningful ? '#FBF9F7' : '#FFFFFF',
                border: item.is_meaningful ? '1px solid #E9B9A9' : '1px solid #E3E7DD'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item.is_meaningful ? '#F6F5EF' : '#F6F5EF'
                }}>
                  {isSteady ? (
                    <ArrowRight size={16} color="#63736B" />
                  ) : isUp ? (
                    <ArrowUpRight size={16} color={iconColor} />
                  ) : (
                    <ArrowDownRight size={16} color={iconColor} />
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#24332F', textTransform: 'capitalize' }}>
                    {item.metric}
                  </span>
                  <div style={{ fontSize: '11px', color: '#63736B' }}>
                    7d: {item.recent_mean} • Prior: {item.prev_mean}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: item.is_meaningful ? iconColor : '#24332F'
                }}>
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </span>
                {item.is_meaningful && (
                  <div style={{ fontSize: '10px', color: '#8B2C1F', fontWeight: '600' }}>
                    Meaningful
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

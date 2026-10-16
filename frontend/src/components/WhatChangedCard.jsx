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
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>What Changed? (7d vs Prior 14d)</h3>
        </div>
        {meaningful_count > 0 && (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '11px',
            fontWeight: '600',
            padding: '3px 8px',
            borderRadius: '12px'
          }}>
            {meaningful_count} Meaningful {meaningful_count === 1 ? 'Shift' : 'Shifts'}
          </span>
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        padding: '10px 12px',
        fontSize: '13px',
        color: '#f1f5f9',
        borderLeft: '3px solid #14b8a6',
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
            ? (item.metric === 'stress' ? '#f43f5e' : (item.metric === 'sleep' ? '#f43f5e' : '#2dd4bf'))
            : '#94a3b8';

          return (
            <div
              key={item.metric}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                background: item.is_meaningful ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: item.is_meaningful ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent'
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
                  background: 'rgba(255, 255, 255, 0.04)'
                }}>
                  {isSteady ? (
                    <ArrowRight size={16} color="#94a3b8" />
                  ) : isUp ? (
                    <ArrowUpRight size={16} color={iconColor} />
                  ) : (
                    <ArrowDownRight size={16} color={iconColor} />
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', textTransform: 'capitalize' }}>
                    {item.metric}
                  </span>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    7d: {item.recent_mean} • Prior: {item.prev_mean}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: item.is_meaningful ? iconColor : '#cbd5e1'
                }}>
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </span>
                {item.is_meaningful && (
                  <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '600' }}>
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

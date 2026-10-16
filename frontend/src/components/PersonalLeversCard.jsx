import React from 'react';
import { Sliders, HelpCircle, ArrowRight } from 'lucide-react';

export default function PersonalLeversCard({ leversData }) {
  if (!leversData || !leversData.has_lever) {
    return null;
  }

  const { statement, disclaimer, diff, higher_sleep_stress_avg, lower_sleep_stress_avg } = leversData;

  return (
    <div className="drift-card" id="personal-levers-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(20, 184, 166, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: '#2dd4bf'
          }}>
            <Sliders size={18} />
          </div>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '4px' }}>Personal Lever</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Lifestyle Correlation in Your Data</h3>
          </div>
        </div>

        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Next-Day Stress Impact
        </span>
      </div>

      <div style={{
        background: 'rgba(20, 184, 166, 0.08)',
        border: '1px solid rgba(20, 184, 166, 0.25)',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '13px',
        color: '#f8fafc',
        lineHeight: '1.5',
        marginBottom: '10px'
      }}>
        {statement}
      </div>

      {higher_sleep_stress_avg !== null && lower_sleep_stress_avg !== null && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '12px' }}>
          <div style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ color: '#94a3b8' }}>Stress after good sleep:</span>{' '}
            <strong style={{ color: '#2dd4bf' }}>{higher_sleep_stress_avg} / 5</strong>
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ color: '#94a3b8' }}>Stress after low sleep:</span>{' '}
            <strong style={{ color: '#f59e0b' }}>{lower_sleep_stress_avg} / 5</strong>
          </div>
        </div>
      )}

      <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
        {disclaimer}
      </div>
    </div>
  );
}

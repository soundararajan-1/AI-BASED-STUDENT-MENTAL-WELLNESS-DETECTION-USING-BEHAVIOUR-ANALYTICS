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
            background: '#DDE9DF',
            padding: '6px',
            borderRadius: '8px',
            color: '#245B52'
          }}>
            <Sliders size={18} />
          </div>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '4px' }}>Personal Lever</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#24332F' }}>Lifestyle Correlation in Your Data</h3>
          </div>
        </div>

        <span style={{ fontSize: '11px', color: '#63736B' }}>
          Next-Day Stress Impact
        </span>
      </div>

      <div style={{
        background: '#FAFBF9',
        border: '1px solid #E3E7DD',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '13px',
        color: '#24332F',
        lineHeight: '1.5',
        marginBottom: '10px'
      }}>
        {statement}
      </div>

      {higher_sleep_stress_avg !== null && lower_sleep_stress_avg !== null && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '12px' }}>
          <div style={{
            flex: 1,
            background: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #E3E7DD'
          }}>
            <span style={{ color: '#63736B' }}>Stress after good sleep:</span>{' '}
            <strong style={{ color: '#245B52' }}>{higher_sleep_stress_avg} / 5</strong>
          </div>
          <div style={{
            flex: 1,
            background: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #E3E7DD'
          }}>
            <span style={{ color: '#63736B' }}>Stress after low sleep:</span>{' '}
            <strong style={{ color: '#8B2C1F' }}>{lower_sleep_stress_avg} / 5</strong>
          </div>
        </div>
      )}

      <div style={{ fontSize: '11px', color: '#63736B', fontStyle: 'italic' }}>
        {disclaimer}
      </div>
    </div>
  );
}

import React from 'react';
import { Sliders, HelpCircle, ArrowRight, Zap, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';

export default function PersonalLeversCard({ leversData }) {
  if (!leversData || !leversData.has_lever) {
    return null;
  }

  const { statement, disclaimer, diff, higher_sleep_stress_avg, lower_sleep_stress_avg } = leversData;
  const stressDiff = (lower_sleep_stress_avg && higher_sleep_stress_avg)
    ? (Number(lower_sleep_stress_avg) - Number(higher_sleep_stress_avg)).toFixed(1)
    : (diff ? Number(diff).toFixed(1) : null);

  return (
    <div className="drift-card card-accent-cyan" id="personal-levers-card" style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0891B2',
            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.15)'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="glow-pill glow-pill-cyan">Personal Modifiable Lever</span>
              {stressDiff && (
                <span className="glow-pill glow-pill-teal">
                  ↓ {stressDiff} Stress Shift
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              Actionable Behavioral Lever
            </h3>
          </div>
        </div>

        <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600, background: '#F6F5EF', padding: '4px 10px', borderRadius: '12px' }}>
          Next-Day Stress Sensitivity
        </span>
      </div>

      {/* Main Statement Box with gradient accent */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(207, 250, 254, 0.25) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: '1px solid #BAE6FD',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '13.5px',
        color: '#164E63',
        lineHeight: '1.5',
        marginBottom: '14px',
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(8, 145, 178, 0.04)'
      }}>
        {statement}
      </div>

      {/* Comparative Cards: Good Sleep vs Low Sleep */}
      {higher_sleep_stress_avg !== null && lower_sleep_stress_avg !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {/* Favorable condition */}
          <div style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
            border: '1.5px solid #86EFAC',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Days With &gt; 7h Sleep
              </span>
              <CheckCircle2 size={16} color="#10B981" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#059669' }}>
                {higher_sleep_stress_avg}
              </span>
              <span style={{ fontSize: '12px', color: '#63736B', fontWeight: 600 }}>/ 5 avg stress</span>
            </div>
            <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px', fontWeight: 500 }}>
              Optimal emotional buffer and cognitive recovery
            </div>
          </div>

          {/* Strained condition */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 100%)',
            border: '1.5px solid #FECDD3',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#BE123C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Days With &lt; 6h Sleep
              </span>
              <AlertTriangle size={16} color="#F43F5E" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#E11D48' }}>
                {lower_sleep_stress_avg}
              </span>
              <span style={{ fontSize: '12px', color: '#63736B', fontWeight: 600 }}>/ 5 avg stress</span>
            </div>
            <div style={{ fontSize: '11px', color: '#9F1239', marginTop: '4px', fontWeight: 500 }}>
              Higher vulnerability to academic overload
            </div>
          </div>
        </div>
      )}

      {/* Scientific disclaimer */}
      <div style={{ fontSize: '11px', color: '#63736B', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <HelpCircle size={13} color="#0891B2" style={{ flexShrink: 0 }} />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}


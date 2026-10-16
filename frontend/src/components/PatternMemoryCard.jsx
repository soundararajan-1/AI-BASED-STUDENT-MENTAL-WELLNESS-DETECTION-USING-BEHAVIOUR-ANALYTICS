import React from 'react';
import { History, GitCommit, Check } from 'lucide-react';

export default function PatternMemoryCard({ memoryData }) {
  if (!memoryData || !memoryData.has_memory) {
    return null;
  }

  const { summary, closest_week, distance, similar_metrics } = memoryData;

  return (
    <div className="drift-card" id="pattern-memory-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.2)',
            padding: '6px',
            borderRadius: '8px',
            color: '#a5b4fc'
          }}>
            <History size={18} />
          </div>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Pattern Memory</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Historical Resemblance</h3>
          </div>
        </div>

        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Vector Distance: {distance}
        </span>
      </div>

      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '13px',
        color: '#f8fafc',
        lineHeight: '1.5',
        marginBottom: '10px'
      }}>
        {summary}
      </div>

      {similar_metrics && similar_metrics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
          <span>Closest metrics:</span>
          {similar_metrics.map((m) => (
            <span
              key={m}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 8px',
                borderRadius: '6px',
                color: '#cbd5e1',
                textTransform: 'capitalize'
              }}
            >
              ✓ {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
            background: '#E8E1F5',
            padding: '6px',
            borderRadius: '8px',
            color: '#4C3B70'
          }}>
            <History size={18} />
          </div>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Pattern Memory</span>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#24332F' }}>Historical Resemblance</h3>
          </div>
        </div>

        <span style={{ fontSize: '11px', color: '#63736B' }}>
          Vector Distance: {distance}
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
        {summary}
      </div>

      {similar_metrics && similar_metrics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#63736B' }}>
          <span>Closest metrics:</span>
          {similar_metrics.map((m) => (
            <span
              key={m}
              style={{
                background: '#F6F5EF',
                border: '1px solid #E3E7DD',
                padding: '3px 8px',
                borderRadius: '6px',
                color: '#24332F',
                fontWeight: 500,
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

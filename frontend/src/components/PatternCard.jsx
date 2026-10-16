import React from 'react';
import { Layers, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function PatternCard({ patternData }) {
  if (!patternData) return null;

  const primary = patternData.primary_pattern;
  const isMatched = primary && primary.matched;
  const name = primary ? primary.name : "Relatively balanced behaviour";
  const description = primary ? primary.description : "All habits are tracking closely within your personal normal band.";
  const evidence = primary ? primary.evidence : ["All metrics within normal limits."];

  return (
    <div className="drift-card" id="pattern-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Rule Engine</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Detected Behavioral Pattern</h3>
        </div>
        <div style={{
          background: isMatched ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: isMatched ? '#a5b4fc' : '#34d399',
          border: isMatched ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {isMatched ? 'Pattern Active' : 'Balanced'}
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '16px'
      }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#2dd4bf', marginBottom: '6px' }}>
          {name}
        </h4>
        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
          {description}
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
          <FileText size={14} />
          <span>Evidence Receipts:</span>
        </div>
        <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {evidence.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#f1f5f9',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '8px 10px',
                borderRadius: '8px',
                borderLeft: '2px solid #6366f1'
              }}
            >
              <CheckCircle size={14} color="#6366f1" style={{ flexShrink: 0 }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

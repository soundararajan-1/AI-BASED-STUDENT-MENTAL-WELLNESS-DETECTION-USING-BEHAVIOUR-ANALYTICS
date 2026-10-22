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
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>Detected Behavioral Pattern</h3>
        </div>
        <div style={{
          background: isMatched ? '#E8E1F5' : '#DDE9DF',
          color: isMatched ? '#4C3B70' : '#245B52',
          border: isMatched ? '1px solid #D5C8EA' : '1px solid #CBD4C2',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {isMatched ? 'Pattern Active' : 'Balanced'}
        </div>
      </div>

      <div style={{
        background: '#FAFBF9',
        border: '1px solid #E3E7DD',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '16px'
      }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#245B52', marginBottom: '6px' }}>
          {name}
        </h4>
        <p style={{ fontSize: '13px', color: '#24332F', lineHeight: '1.5' }}>
          {description}
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#63736B', marginBottom: '8px', textTransform: 'uppercase' }}>
          <FileText size={14} color="#245B52" />
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
                color: '#24332F',
                background: '#FFFFFF',
                border: '1px solid #E3E7DD',
                padding: '8px 12px',
                borderRadius: '8px',
                borderLeft: '3px solid #245B52'
              }}
            >
              <CheckCircle size={14} color="#245B52" style={{ flexShrink: 0 }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

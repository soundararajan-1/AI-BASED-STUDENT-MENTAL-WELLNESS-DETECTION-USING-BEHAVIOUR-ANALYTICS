import React from 'react';
import { Layers, CheckCircle2, Sparkles, FileText, Check } from 'lucide-react';

export default function PatternCard({ patternData }) {
  if (!patternData) return null;

  const primary = patternData.primary_pattern;
  const isMatched = primary && primary.matched;
  const name = primary ? primary.name : "Relatively balanced behaviour";
  const description = primary ? primary.description : "All habits are tracking closely within your personal normal band.";
  const evidence = primary ? primary.evidence : ["All metrics within normal limits."];

  return (
    <div className={`drift-card ${isMatched ? 'card-accent-indigo' : 'card-accent-teal'}`} id="pattern-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isMatched ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isMatched ? '#6366F1' : '#0D9488',
            boxShadow: isMatched ? '0 4px 12px rgba(99, 102, 241, 0.15)' : '0 4px 12px rgba(13, 148, 136, 0.15)'
          }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className={`glow-pill ${isMatched ? 'glow-pill-indigo' : 'glow-pill-teal'}`}>
                {isMatched ? 'Behavioral Archetype' : 'Baseline Alignment'}
              </span>
              <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600 }}>Rule-Based Classifier</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              Detected Behavioral Pattern
            </h3>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isMatched ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: isMatched ? '#4F46E5' : '#047857',
          border: isMatched ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <span className={`status-dot ${isMatched ? 'status-dot-amber' : 'status-dot-emerald'}`} />
          <span>{isMatched ? 'Pattern Active' : 'Harmonious Band'}</span>
        </div>
      </div>

      <div style={{
        background: isMatched
          ? 'linear-gradient(135deg, rgba(238, 242, 255, 0.5) 0%, rgba(255, 255, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(240, 253, 244, 0.5) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: isMatched ? '1px solid #C7D2FE' : '1px solid #A7F3D0',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: isMatched ? '#4338CA' : '#065F46', marginBottom: '6px' }}>
          {name}
        </h4>
        <p style={{ fontSize: '13px', color: '#24332F', lineHeight: '1.5', margin: 0 }}>
          {description}
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#63736B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <FileText size={13} color="#0D9488" />
          <span>Evidence Receipts (Zero Hallucination):</span>
        </div>
        <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, margin: 0 }}>
          {evidence.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: '#24332F',
                background: '#FFFFFF',
                border: '1px solid #E3E7DD',
                padding: '9px 12px',
                borderRadius: '8px',
                borderLeft: isMatched ? '3px solid #6366F1' : '3px solid #10B981',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isMatched ? '#EEF2FF' : '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check size={12} color={isMatched ? '#4F46E5' : '#059669'} />
              </div>
              <span style={{ fontWeight: 500 }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


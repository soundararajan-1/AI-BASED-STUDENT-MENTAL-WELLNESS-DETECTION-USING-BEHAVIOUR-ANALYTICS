import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, X, Shield, FileCheck, Lightbulb, HeartHandshake } from 'lucide-react';

export default function AiInsightCard({ insightData }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  if (!insightData) return null;

  const { what_changed, pattern, factors, suggestions, support, receipts, source } = insightData;

  const handleSentenceClick = (claimKeyword) => {
    if (!receipts || receipts.length === 0) return;
    const match = receipts.find((r) =>
      r.claim?.toLowerCase().includes(claimKeyword.toLowerCase()) ||
      r.sentence?.toLowerCase().includes(claimKeyword.toLowerCase())
    ) || receipts[0];
    setSelectedReceipt(match);
  };

  return (
    <div className="drift-card card-accent-indigo" id="ai-insight-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366F1',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="glow-pill glow-pill-indigo">Ground-Truth Reflection</span>
              <span style={{ fontSize: '11px', color: '#63736B', fontWeight: 600 }}>Zero-Hallucination Verified</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#24332F', margin: 0 }}>
              AI Wellness Reflection with Receipts
            </h3>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#047857',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '5px 12px',
          borderRadius: '16px',
          fontSize: '11.5px',
          fontWeight: '700'
        }}>
          <Shield size={14} color="#10B981" />
          <span>Audited Receipt Trail</span>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.45) 0%, rgba(255, 255, 255, 0.95) 100%)',
        borderRadius: '12px',
        padding: '16px 18px',
        border: '1px solid #C7D2FE',
        marginBottom: '16px',
        lineHeight: '1.7',
        fontSize: '14px',
        color: '#24332F',
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.04)'
      }}>
        <p style={{ marginBottom: '12px' }}>
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('shift')}
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              padding: '2px 6px',
              borderRadius: '6px',
              borderBottom: '2px solid #6366F1',
              cursor: 'pointer',
              color: '#312E81',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
          >
            {what_changed}
          </span>
        </p>

        <p style={{ marginBottom: '12px' }}>
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('pattern')}
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              padding: '2px 6px',
              borderRadius: '6px',
              borderBottom: '2px solid #6366F1',
              cursor: 'pointer',
              color: '#312E81',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
          >
            {pattern}
          </span>{' '}
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('drift')}
            style={{
              background: 'rgba(13, 148, 136, 0.08)',
              padding: '2px 6px',
              borderRadius: '6px',
              borderBottom: '2px solid #0D9488',
              cursor: 'pointer',
              color: '#134E4A',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
          >
            {factors}
          </span>
        </p>

        {support && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#065F46',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginTop: '12px',
            fontWeight: 600
          }}>
            <HeartHandshake size={16} color="#10B981" />
            <span>{support}</span>
          </div>
        )}
      </div>

      {/* Micro-suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#63736B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Lightbulb size={13} color="#F59E0B" />
            <span>Gentle Micro-Adjustments:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {suggestions.map((s, idx) => (
              <div key={idx} style={{
                fontSize: '13px',
                color: '#24332F',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E3E7DD',
                borderLeft: '3.5px solid #0D9488',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: '#0D9488', fontWeight: 800 }}>•</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#63736B' }}>
        <span>Tip: Click any highlighted text above to inspect its underlying numerical facts.</span>
        <button
          type="button"
          onClick={() => setSelectedReceipt(receipts?.[0] || null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0D9488',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '11.5px'
          }}
        >
          View All Receipts →
        </button>
      </div>

      {/* Evidence Receipt Modal / Drawer */}
      {selectedReceipt && (
        <div className="modal-overlay" style={{ zIndex: 120 }}>
          <div className="modal-content" style={{ maxWidth: '480px', background: '#FFFFFF', border: '1px solid #E3E7DD', boxShadow: '0 12px 36px rgba(36, 51, 47, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#245B52" />
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>Evidence Receipt</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', color: '#63736B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#DDE9DF',
              border: '1px solid #CBD4C2',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13px',
              color: '#245B52',
              marginBottom: '14px',
              fontStyle: 'italic',
              fontWeight: 500
            }}>
              "{selectedReceipt.sentence}"
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#63736B', textTransform: 'uppercase' }}>
                Underlying Numerical Proof:
              </span>
              <ul style={{ listStyleType: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedReceipt.evidence?.map((item, idx) => (
                  <li key={idx} style={{
                    fontSize: '13px',
                    color: '#24332F',
                    background: '#F6F5EF',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    borderLeft: '3px solid #245B52'
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ fontSize: '11px', color: '#63736B', marginBottom: '16px', lineHeight: '1.4' }}>
              Every sentence rendered by Drift must validate against real logged metrics.
              Hallucinated numbers and clinical diagnostic words are blocked by the rule validator.
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setSelectedReceipt(null)}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

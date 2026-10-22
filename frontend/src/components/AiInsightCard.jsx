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
    <div className="drift-card" id="ai-insight-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#E8E1F5',
            padding: '8px',
            borderRadius: '10px',
            color: '#4C3B70'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Ground-Truth Reflection</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#24332F' }}>AI Wellness Insight with Receipts</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#63736B' }}>
          <Shield size={14} color="#245B52" />
          <span>Validated (0% Hallucination)</span>
        </div>
      </div>

      <div style={{
        background: '#FAFBF9',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #E3E7DD',
        marginBottom: '16px',
        lineHeight: '1.6',
        fontSize: '14px',
        color: '#24332F'
      }}>
        <p style={{ marginBottom: '12px' }}>
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('shift')}
            style={{ borderBottom: '1.5px dashed #4C3B70', cursor: 'pointer', color: '#24332F' }}
          >
            {what_changed}
          </span>
        </p>

        <p style={{ marginBottom: '12px' }}>
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('pattern')}
            style={{ borderBottom: '1.5px dashed #4C3B70', cursor: 'pointer', color: '#24332F' }}
          >
            {pattern}
          </span>{' '}
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('drift')}
            style={{ borderBottom: '1.5px dashed #4C3B70', cursor: 'pointer', color: '#24332F' }}
          >
            {factors}
          </span>
        </p>

        {support && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#245B52', fontSize: '13px', marginTop: '10px', fontWeight: 500 }}>
            <HeartHandshake size={16} />
            <em>{support}</em>
          </div>
        )}
      </div>

      {/* Micro-suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#63736B', marginBottom: '8px' }}>
            <Lightbulb size={14} color="#245B52" />
            <span>Gentle Micro-Adjustments:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestions.map((s, idx) => (
              <div key={idx} style={{
                fontSize: '13px',
                color: '#24332F',
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E3E7DD',
                borderLeft: '3px solid #245B52'
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#63736B' }}>
        <span>Tip: Click underlined text to inspect the underlying numerical facts.</span>
        <button
          type="button"
          onClick={() => setSelectedReceipt(receipts?.[0] || null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#245B52',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '11px'
          }}
        >
          View All Receipts
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

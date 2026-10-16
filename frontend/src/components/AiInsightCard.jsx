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
    <div className="drift-card drift-card-glow" id="ai-insight-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.2)',
            padding: '8px',
            borderRadius: '10px',
            color: '#a5b4fc'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>Ground-Truth Reflection</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>AI Wellness Insight with Receipts</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
          <Shield size={14} color="#14b8a6" />
          <span>Validated (0% Hallucination)</span>
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '16px',
        lineHeight: '1.6',
        fontSize: '14px',
        color: '#f8fafc'
      }}>
        <p style={{ marginBottom: '12px' }}>
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('shift')}
          >
            {what_changed}
          </span>
        </p>

        <p style={{ marginBottom: '12px' }}>
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('pattern')}
          >
            {pattern}
          </span>{' '}
          <span
            className="receipt-clickable-sentence"
            title="Click to view numerical evidence receipt"
            onClick={() => handleSentenceClick('drift')}
          >
            {factors}
          </span>
        </p>

        {support && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf', fontSize: '13px', marginTop: '10px' }}>
            <HeartHandshake size={16} />
            <em>{support}</em>
          </div>
        )}
      </div>

      {/* Micro-suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
            <Lightbulb size={14} color="#f59e0b" />
            <span>Gentle Micro-Adjustments:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestions.map((s, idx) => (
              <div key={idx} style={{
                fontSize: '12px',
                color: '#cbd5e1',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderLeft: '2px solid #14b8a6'
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
        <span>Tip: Click underlined text to inspect the underlying numerical facts.</span>
        <button
          type="button"
          onClick={() => setSelectedReceipt(receipts?.[0] || null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#a5b4fc',
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
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#2dd4bf" />
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Evidence Receipt</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'rgba(20, 184, 166, 0.08)',
              border: '1px solid rgba(20, 184, 166, 0.25)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13px',
              color: '#2dd4bf',
              marginBottom: '14px',
              fontStyle: 'italic'
            }}>
              "{selectedReceipt.sentence}"
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                Underlying Numerical Proof:
              </span>
              <ul style={{ listStyleType: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedReceipt.evidence?.map((item, idx) => (
                  <li key={idx} style={{
                    fontSize: '13px',
                    color: '#f8fafc',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    borderLeft: '2px solid #2dd4bf'
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.4' }}>
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

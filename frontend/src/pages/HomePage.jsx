import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Cpu,
  Database,
  BarChart3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  HeartHandshake,
  Layers,
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import {
  PROJECT_TITLE,
  PROJECT_SUBTITLE,
  ETHICAL_DISCLAIMER,
  ROADMAP_PHASES,
  NOVELTY_PILLARS
} from '../utils/constants';

export default function HomePage({ onOpenDashboard, onOpenLogin }) {
  const { health, refreshHealth } = useHealth();
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPhase, setFilterPhase] = useState('all');

  const filteredPhases = ROADMAP_PHASES.filter(p => {
    if (filterPhase === 'completed') return p.status === 'completed';
    if (filterPhase === 'pending') return p.status === 'pending';
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Banner Disclaimer */}
      <div
        style={{
          background: 'var(--muted-lavender)',
          border: '1px solid #D6CCEE',
          borderRadius: '14px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          color: 'var(--text-main)',
          fontSize: '13px'
        }}
      >
        <ShieldCheck size={20} color="#5B487A" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, lineHeight: 1.5 }}>
          <strong style={{ color: '#5B487A' }}>Ethical &amp; Academic Notice:</strong> {ETHICAL_DISCLAIMER}
        </div>
        <span className="badge badge-purple">Academic Prototype</span>
      </div>

      {/* Hero Header */}
      <header style={{ marginBottom: '36px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span className="badge badge-teal">Phase 1 Complete</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>AI &amp; Data Science Engineering Project</span>
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
            marginBottom: '12px',
            color: 'var(--text-main)'
          }}
        >
          {PROJECT_TITLE}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '820px', lineHeight: 1.6 }}>
          {PROJECT_SUBTITLE}. Replaces repetitive questionnaires with low-effort check-ins, learns individual normal baselines, computes parameter changes, and delivers transparent, evidence-backed insights.
        </p>

        {/* Live Backend Connection Card */}
        <div
          className="drift-card"
          style={{
            marginTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '20px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: (health.status === 'ok' || health.status === 'healthy') ? 'var(--soft-sage)' : '#FFF0ED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Activity
                size={22}
                color={(health.status === 'ok' || health.status === 'healthy') ? 'var(--primary-brand)' : '#8B2C1F'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>FastAPI Backend Status:</span>
                <span
                  className={
                    (health.status === 'ok' || health.status === 'healthy')
                      ? 'badge badge-teal'
                      : health.status === 'checking'
                      ? 'badge badge-coral'
                      : 'badge badge-coral'
                  }
                >
                  {(health.status === 'ok' || health.status === 'healthy') ? 'ONLINE (200 OK)' : health.status.toUpperCase()}
                </span>
                {health.latency && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    • {health.latency}ms latency
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {health.service ? `${health.service} v${health.version || '1.0'}` : 'Checking backend health...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={refreshHealth}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              title="Ping Backend Health"
            >
              <RefreshCw size={14} className={health.status === 'checking' ? 'animate-spin' : ''} />
              Ping API
            </button>
            <button
              onClick={onOpenLogin}
              className="btn-secondary"
              style={{ fontSize: '13px' }}
            >
              Sign In / Portals
            </button>
            <button
              onClick={onOpenDashboard}
              className="btn-primary"
              style={{ fontSize: '13px' }}
            >
              Open Dashboard Demo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            background: activeTab === 'overview' ? 'var(--soft-sage)' : 'transparent',
            color: activeTab === 'overview' ? 'var(--primary-brand)' : 'var(--text-secondary)',
            border: activeTab === 'overview' ? '1px solid #C4D9C7' : '1px solid transparent',
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Novelty &amp; Architecture
        </button>
        <button
          onClick={() => setActiveTab('phases')}
          style={{
            background: activeTab === 'phases' ? 'var(--soft-sage)' : 'transparent',
            color: activeTab === 'phases' ? 'var(--primary-brand)' : 'var(--text-secondary)',
            border: activeTab === 'phases' ? '1px solid #C4D9C7' : '1px solid transparent',
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Implementation Roadmap (16 Phases)
        </button>
        <button
          onClick={() => setActiveTab('health')}
          style={{
            background: activeTab === 'health' ? 'var(--soft-sage)' : 'transparent',
            color: activeTab === 'health' ? 'var(--primary-brand)' : 'var(--text-secondary)',
            border: activeTab === 'health' ? '1px solid #C4D9C7' : '1px solid transparent',
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          API Diagnostics &amp; Health
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Sparkles size={20} color="var(--primary-brand)" /> Core Research Novelty
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              marginBottom: '36px'
            }}
          >
            {NOVELTY_PILLARS.map((pillar, idx) => (
              <div key={idx} className="drift-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="badge badge-teal" style={{ alignSelf: 'flex-start', marginBottom: '12px' }}>
                  {pillar.tag}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>{pillar.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, flex: 1 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Layers size={20} color="#5B487A" /> End-to-End System Pipeline
          </h2>
          <div className="drift-card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                textAlign: 'center'
              }}
            >
              {[
                { title: '1. Student Input', desc: 'Quick 25s check-in' },
                { title: '2. Personal Baseline', desc: 'Learned normal band' },
                { title: '3. What Changed?', desc: 'Signed deltas (Δ)' },
                { title: '4. Trend Analysis', desc: '7d, 14d, 30d slope' },
                { title: '5. Pattern Engine', desc: 'Academic, Digital, Social' },
                { title: '6. Random Forest', desc: 'Secondary classifier' },
                { title: '7. Wellness Score', desc: '0–100 indicator' },
                { title: '8. LLM Guidance', desc: 'Non-clinical receipts' }
              ].map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#FAFBF9',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 10px'
                  }}
                >
                  <div style={{ color: 'var(--primary-brand)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    {step.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Roadmap Phases */}
      {activeTab === 'phases' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>Project Implementation Phases</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'completed', 'pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterPhase(f)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    border: filterPhase === f ? '1px solid var(--primary-brand)' : '1px solid var(--border-color)',
                    background: filterPhase === f ? 'var(--soft-sage)' : '#FAFBF9',
                    color: filterPhase === f ? 'var(--primary-brand)' : 'var(--text-secondary)'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredPhases.map(phase => (
              <div
                key={phase.id}
                className="drift-card"
                style={{
                  borderLeft: phase.status === 'completed' ? '4px solid var(--primary-brand)' : '4px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{phase.title}</h4>
                  <span
                    className={phase.status === 'completed' ? 'badge badge-teal' : 'badge'}
                    style={{
                      background: phase.status === 'completed' ? 'var(--soft-sage)' : '#FAFBF9',
                      color: phase.status === 'completed' ? 'var(--primary-brand)' : 'var(--text-secondary)',
                      border: phase.status === 'completed' ? '1px solid #C4D9C7' : '1px solid var(--border-color)'
                    }}
                  >
                    {phase.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Health & Diagnostics */}
      {activeTab === 'health' && (
        <div className="drift-card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>API Endpoint Diagnostics</h2>
          <div style={{ background: '#FAFBF9', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', fontFamily: 'monospace', fontSize: '13px' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>// Current response from GET http://127.0.0.1:8000/health:</div>
            <pre style={{ color: 'var(--primary-brand)', margin: 0, whiteSpace: 'pre-wrap', fontWeight: 600 }}>
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', fontSize: '13px' }}
            >
              Open Swagger Docs (/docs)
            </a>
            <a
              href="http://127.0.0.1:8000/health"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', fontSize: '13px' }}
            >
              View Raw /health JSON
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: '60px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px'
        }}
      >
        <p>AI-Based Student Mental Wellness Detection Using Behaviour Analytics • College Project Prototype</p>
        <p style={{ marginTop: '4px' }}>
          Strictly Non-Clinical • Software Prototype • Designed for AI &amp; Data Science Viva Demonstration
        </p>
      </footer>
    </div>
  );
}

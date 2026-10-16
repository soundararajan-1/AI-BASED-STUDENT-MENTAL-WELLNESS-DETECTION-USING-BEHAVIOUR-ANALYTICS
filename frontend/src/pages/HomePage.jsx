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
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          color: '#cbd5e1',
          fontSize: '13px'
        }}
      >
        <ShieldCheck size={20} color="#818cf8" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#ffffff' }}>Ethical & Academic Notice:</strong> {ETHICAL_DISCLAIMER}
        </div>
        <span className="badge badge-indigo">Academic Prototype</span>
      </div>

      {/* Hero Header */}
      <header style={{ marginBottom: '36px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span className="badge badge-teal">Phase 1 Complete</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>AI & Data Science Engineering Project</span>
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {PROJECT_TITLE}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '820px' }}>
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
            padding: '18px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: (health.status === 'ok' || health.status === 'healthy') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Activity
                size={22}
                color={(health.status === 'ok' || health.status === 'healthy') ? '#10b981' : '#f43f5e'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>FastAPI Backend Status:</span>
                <span
                  className={
                    (health.status === 'ok' || health.status === 'healthy')
                      ? 'badge badge-teal'
                      : health.status === 'checking'
                      ? 'badge badge-warning'
                      : 'badge badge-danger'
                  }
                >
                  {(health.status === 'ok' || health.status === 'healthy') ? 'ONLINE (200 OK)' : health.status.toUpperCase()}
                </span>
                {health.latency && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    • {health.latency}ms latency
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {health.service ? `${health.service} v${health.version || '1.0'}` : 'Checking http://127.0.0.1:8000/health...'}
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
              style={{ fontSize: '13px', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#c7d2fe' }}
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
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            background: activeTab === 'overview' ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
            color: activeTab === 'overview' ? 'var(--teal-light)' : 'var(--text-muted)',
            border: activeTab === 'overview' ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid transparent',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Novelty & Architecture
        </button>
        <button
          onClick={() => setActiveTab('phases')}
          style={{
            background: activeTab === 'phases' ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
            color: activeTab === 'phases' ? 'var(--teal-light)' : 'var(--text-muted)',
            border: activeTab === 'phases' ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid transparent',
            padding: '8px 16px',
            borderRadius: '8px',
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
            background: activeTab === 'health' ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
            color: activeTab === 'health' ? 'var(--teal-light)' : 'var(--text-muted)',
            border: activeTab === 'health' ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid transparent',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          API Diagnostics & Health
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--teal-light)" /> Core Research Novelty
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
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{pillar.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, flex: 1 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#a5b4fc" /> End-to-End System Pipeline
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
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '14px 10px'
                  }}
                >
                  <div style={{ color: 'var(--teal-light)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    {step.title}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{step.desc}</div>
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
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Project Implementation Phases</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'completed', 'pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterPhase(f)}
                  className="btn-secondary"
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    background: filterPhase === f ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)'
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
                  borderLeft: phase.status === 'completed' ? '4px solid var(--teal-primary)' : '4px solid rgba(255,255,255,0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{phase.title}</h4>
                  <span
                    className={phase.status === 'completed' ? 'badge badge-teal' : 'badge'}
                    style={{
                      background: phase.status === 'completed' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255,255,255,0.06)',
                      color: phase.status === 'completed' ? 'var(--teal-light)' : 'var(--text-muted)'
                    }}
                  >
                    {phase.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Health & Diagnostics */}
      {activeTab === 'health' && (
        <div className="drift-card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>API Endpoint Diagnostics</h2>
          <div style={{ background: '#080d1a', borderRadius: '12px', padding: '16px', fontFamily: 'monospace', fontSize: '13px' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>// Current response from GET http://127.0.0.1:8000/health:</div>
            <pre style={{ color: '#a5f3fc', margin: 0, whiteSpace: 'pre-wrap' }}>
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
          borderTop: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}
      >
        <p>AI-Based Student Mental Wellness Detection Using Behaviour Analytics • College Project Prototype</p>
        <p style={{ marginTop: '4px' }}>
          Strictly Non-Clinical • Software Prototype • Designed for AI & Data Science Viva Demonstration
        </p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Activity,
  Cpu,
  RefreshCw,
  BarChart2,
  Users,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Building2,
  GraduationCap
} from 'lucide-react';
import {
  fetchAdminStats,
  checkBackendHealth,
  fetchEvaluationResults,
  fetchPendingApprovals,
  verifyUserAccount
} from '../services/api';

export default function AdminPortalPage({ adminUser, onBackToHome }) {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [evalData, setEvalData] = useState(null);
  const [approvalsData, setApprovalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalLoading, setEvalLoading] = useState(false);
  const [approvalLoadingId, setApprovalLoadingId] = useState(null);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [activeApprovalTab, setActiveApprovalTab] = useState('students'); // 'students' | 'counsellors' | 'approved'

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminStats, healthRes, approvalsRes] = await Promise.all([
        fetchAdminStats(),
        checkBackendHealth(),
        fetchPendingApprovals()
      ]);
      setStats(adminStats);
      setHealth(healthRes);
      setApprovalsData(approvalsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userType, identifier, action) => {
    setApprovalLoadingId(`${userType}-${identifier}`);
    setApprovalMessage('');
    try {
      const res = await verifyUserAccount({
        user_type: userType,
        identifier,
        action
      });
      setApprovalMessage(res.message);
      // Reload approvals & stats
      const [newApprovals, newStats] = await Promise.all([
        fetchPendingApprovals(),
        fetchAdminStats()
      ]);
      setApprovalsData(newApprovals);
      setStats(newStats);
    } catch (err) {
      setApprovalMessage(err.message || 'Verification update failed.');
    } finally {
      setApprovalLoadingId(null);
    }
  };

  const handleRunEvaluation = async () => {
    setEvalLoading(true);
    try {
      const res = await fetchEvaluationResults();
      setEvalData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-warning">Admin Console</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Super Administrator Permissions</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Platform System & Telemetry Console</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Logged in as: <strong>{adminUser?.email || 'admin@campus.edu'}</strong> • Full Database Inspection
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Real-time System KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="drift-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
            <Users size={16} color="var(--teal-light)" /> Total Registered Students
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#ffffff' }}>
            {stats?.total_students ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--teal-light)', marginTop: '2px' }}>
            {stats?.consented_students} with verified consent
          </div>
        </div>

        <div className="drift-card" style={{ border: (approvalsData?.counts?.total_pending || 0) > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (approvalsData?.counts?.total_pending || 0) > 0 ? '#fde047' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
            <Clock size={16} color="#f59e0b" /> Pending Verifications
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: (approvalsData?.counts?.total_pending || 0) > 0 ? '#fde047' : '#ffffff' }}>
            {approvalsData?.counts?.total_pending ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
            {approvalsData?.counts?.pending_students ?? 0} students • {approvalsData?.counts?.pending_counsellors ?? 0} counsellors
          </div>
        </div>

        <div className="drift-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
            <Database size={16} color="#a5b4fc" /> Total Check-ins
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#a5b4fc' }}>
            {stats?.total_checkins_logged?.toLocaleString() ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
            Structured time-series entries
          </div>
        </div>

        <div className="drift-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
            <Server size={16} color="#34d399" /> Backend Latency
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#34d399' }}>
            {health?.latency ? `${health.latency}ms` : '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
            FastAPI Server (200 OK)
          </div>
        </div>
      </div>

      {/* Account Verification & Approvals Management Section */}
      <div className="drift-card" style={{ marginBottom: '28px', border: '1px solid rgba(245, 158, 11, 0.35)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>Security Gate</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#f59e0b" /> Campus Account Verification &amp; Approval System
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Review newly registered students and counsellor credentials. Only approved profiles can sign in.
            </p>
          </div>

          {/* Sub Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveApprovalTab('students')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeApprovalTab === 'students' ? '1px solid var(--teal-light)' : '1px solid rgba(255,255,255,0.08)',
                background: activeApprovalTab === 'students' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255,255,255,0.04)',
                color: activeApprovalTab === 'students' ? '#2dd4bf' : 'var(--text-muted)'
              }}
            >
              Pending Students ({approvalsData?.counts?.pending_students || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveApprovalTab('counsellors')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeApprovalTab === 'counsellors' ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                background: activeApprovalTab === 'counsellors' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                color: activeApprovalTab === 'counsellors' ? '#a5b4fc' : 'var(--text-muted)'
              }}
            >
              Pending Counsellors ({approvalsData?.counts?.pending_counsellors || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveApprovalTab('approved')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeApprovalTab === 'approved' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                background: activeApprovalTab === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                color: activeApprovalTab === 'approved' ? '#6ee7b7' : 'var(--text-muted)'
              }}
            >
              Verified / Approved
            </button>
          </div>
        </div>

        {approvalMessage && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle2 size={16} />
            <span>{approvalMessage}</span>
          </div>
        )}

        {/* Tab 1: Pending Students */}
        {activeApprovalTab === 'students' && (
          <div>
            {!approvalsData?.pending_students?.length ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <div>All student registrations are verified and up to date!</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>Student ID</th>
                      <th style={{ padding: '10px 8px' }}>Name</th>
                      <th style={{ padding: '10px 8px' }}>Department</th>
                      <th style={{ padding: '10px 8px' }}>Year</th>
                      <th style={{ padding: '10px 8px' }}>Registered At</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Admin Verification Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsData.pending_students.map((stu) => {
                      const isProcessing = approvalLoadingId === `student-${stu.id}`;
                      return (
                        <tr key={stu.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: '#f8fafc' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <GraduationCap size={15} color="var(--teal-light)" />
                              {stu.id}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>{stu.name}</td>
                          <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{stu.department}</td>
                          <td style={{ padding: '10px 8px', color: '#94a3b8' }}>Year {stu.year}</td>
                          <td style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8' }}>{stu.registered_at}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleVerify('student', stu.id, 'approve')}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <UserCheck size={13} />
                                <span>Approve ID</span>
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleVerify('student', stu.id, 'reject')}
                                style={{
                                  background: 'rgba(244, 63, 94, 0.2)',
                                  color: '#fda4af',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <UserX size={13} />
                                <span>Decline</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Counsellors */}
        {activeApprovalTab === 'counsellors' && (
          <div>
            {!approvalsData?.pending_counsellors?.length ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                <CheckCircle2 size={24} color="#818cf8" style={{ margin: '0 auto 8px' }} />
                <div>No pending counsellor applications. All accounts verified!</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>Counsellor Name</th>
                      <th style={{ padding: '10px 8px' }}>Campus Email</th>
                      <th style={{ padding: '10px 8px' }}>Specialization</th>
                      <th style={{ padding: '10px 8px' }}>Phone</th>
                      <th style={{ padding: '10px 8px' }}>Application Date</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Admin Verification Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsData.pending_counsellors.map((c) => {
                      const isProcessing = approvalLoadingId === `counsellor-${c.email}`;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: '#f8fafc' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building2 size={15} color="#818cf8" />
                              {c.name}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>{c.email}</td>
                          <td style={{ padding: '10px 8px', color: '#a5b4fc' }}>{c.specialization}</td>
                          <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{c.phone || '—'}</td>
                          <td style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8' }}>{c.registered_at}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleVerify('counsellor', c.email, 'approve')}
                                style={{
                                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <UserCheck size={13} />
                                <span>Approve Access</span>
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleVerify('counsellor', c.email, 'reject')}
                                style={{
                                  background: 'rgba(244, 63, 94, 0.2)',
                                  color: '#fda4af',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <UserX size={13} />
                                <span>Decline</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Approved / Verified Accounts */}
        {activeApprovalTab === 'approved' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--teal-light)', marginBottom: '8px' }}>
                  Recently Approved Students
                </h4>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px' }}>
                  {approvalsData?.approved_students?.slice(0, 5).map((stu) => (
                    <div key={stu.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{stu.id} ({stu.name})</span>
                      <span className="badge badge-teal" style={{ fontSize: '10px' }}>Verified</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px' }}>
                  Approved Counsellors
                </h4>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>Dr. Sarah Jenkins, Ph.D.</span>
                    <span className="badge badge-indigo" style={{ fontSize: '10px' }}>Lead Counsellor</span>
                  </div>
                  {approvalsData?.approved_counsellors?.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{c.name}</span>
                      <span className="badge badge-indigo" style={{ fontSize: '10px' }}>Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Database Inspection & Model Benchmarks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Sample Student Table */}
        <div className="drift-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--teal-light)" /> Registered Student Database Roster (Sample)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 6px' }}>Student ID</th>
                  <th style={{ padding: '8px 6px' }}>Department</th>
                  <th style={{ padding: '8px 6px' }}>Year</th>
                  <th style={{ padding: '8px 6px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.sample_students?.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600, color: '#ffffff' }}>{s.id}</td>
                    <td style={{ padding: '8px 6px', color: '#cbd5e1' }}>{s.dept}</td>
                    <td style={{ padding: '8px 6px', color: '#94a3b8' }}>Year {s.year}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span className="badge badge-teal" style={{ fontSize: '10px' }}>Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machine Learning Model Diagnostics */}
        <div className="drift-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#fde047" /> Machine Learning & Pipeline Telemetry
          </h3>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Secondary Classifier:</span>
              <strong style={{ color: '#ffffff' }}>Random Forest (100 Estimators)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary Intelligence:</span>
              <strong style={{ color: 'var(--teal-light)' }}>Rule-Based Change & Pattern Engines</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Grounding Validator:</span>
              <strong style={{ color: '#6ee7b7' }}>Active (No Banned Words / No Hallucinations)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Engine:</span>
              <strong style={{ color: '#a5b4fc' }}>{stats?.database_engine || 'SQLite / Supabase'}</strong>
            </div>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={evalLoading}
            className="btn-primary"
            style={{ width: '100%', fontSize: '13px', padding: '12px' }}
          >
            <BarChart2 size={16} />
            {evalLoading ? 'Loading Benchmark...' : 'Inspect Evaluation Results & Metrics'}
          </button>

          {evalData && (
            <div style={{ marginTop: '14px', background: '#0a0f1d', borderRadius: '10px', padding: '12px', fontSize: '12px', fontFamily: 'monospace' }}>
              <div style={{ color: '#6ee7b7', fontWeight: 700, marginBottom: '4px' }}>Benchmark Summary:</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
                {JSON.stringify(evalData.headline_metrics || evalData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

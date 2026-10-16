import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Users,
  RefreshCw,
  HeartHandshake,
  BarChart2,
  Info,
  Bell,
  MessageCircle,
  Send,
  CheckCircle2,
  User,
  Clock,
  X,
  PhoneCall
} from 'lucide-react';
import {
  fetchCounsellorSummary,
  fetchCounsellorAlerts,
  acceptCounsellorAlert,
  resolveCounsellorAlert,
  fetchAlertMessages,
  sendAlertMessage
} from '../services/api';

export default function CounsellorPortalPage({ counsellorUser, onBackToHome }) {
  const [data, setData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [activeAlertChat, setActiveAlertChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const chatEndRef = useRef(null);

  const counsellorName = counsellorUser?.name || "Dr. Sarah Jenkins, Ph.D.";
  const counsellorEmail = counsellorUser?.email || "counsellor@campus.edu";

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [summaryRes, alertsRes] = await Promise.all([
        fetchCounsellorSummary(),
        fetchCounsellorAlerts("all")
      ]);
      setData(summaryRes);
      setAlertsData(alertsRes);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load counsellor data');
    } finally {
      setLoading(false);
    }
  };

  const loadAlertMessages = async (alertId) => {
    try {
      const res = await fetchAlertMessages(alertId);
      setChatMessages(res.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAlert = async (alert) => {
    setAcceptingId(alert.alert_id);
    try {
      await acceptCounsellorAlert(alert.alert_id, {
        counsellor_email: counsellorEmail,
        counsellor_name: counsellorName
      });
      // Refresh alert list and open chat session
      const updatedAlerts = await fetchCounsellorAlerts("all");
      setAlertsData(updatedAlerts);
      const acceptedAlert = updatedAlerts.alerts.find((a) => a.alert_id === alert.alert_id) || alert;
      setActiveAlertChat(acceptedAlert);
      loadAlertMessages(alert.alert_id);
    } catch (err) {
      alert(err.message || 'Failed to accept alert');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleOpenExistingChat = (alert) => {
    setActiveAlertChat(alert);
    loadAlertMessages(alert.alert_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeAlertChat || sendingMsg) return;

    setSendingMsg(true);
    try {
      const sent = await sendAlertMessage(activeAlertChat.alert_id, {
        sender_role: "counsellor",
        sender_name: counsellorName,
        sender_id: counsellorEmail,
        message: inputMessage.trim()
      });
      setInputMessage('');
      setChatMessages((prev) => [...prev, sent.message]);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleResolveSession = async (alertId) => {
    if (!window.confirm("Conclude this student consultation session?")) return;
    try {
      await resolveCounsellorAlert(alertId);
      const updatedAlerts = await fetchCounsellorAlerts("all");
      setAlertsData(updatedAlerts);
      setActiveAlertChat(null);
    } catch (err) {
      alert(err.message || 'Failed to resolve session');
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh alerts every 8 seconds for real-time responsiveness
    const interval = setInterval(() => {
      fetchCounsellorAlerts("all").then(setAlertsData).catch(() => {});
      if (activeAlertChat) {
        fetchAlertMessages(activeAlertChat.alert_id)
          .then((res) => setChatMessages(res.messages || []))
          .catch(() => {});
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [activeAlertChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-indigo">Counsellor Portal</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Strictly Anonymized Planning (k &ge; 5)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Campus Departmental Wellness Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Logged in as: <strong>{counsellorUser?.email || 'counsellor@campus.edu'}</strong> • Department-Level Trends Only
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Live Student Help Alerts & SOS Consultation Queue */}
      <div
        className="drift-card"
        style={{
          marginBottom: '28px',
          border: (alertsData?.open_count || 0) > 0 ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: (alertsData?.open_count || 0) > 0 ? '0 0 25px rgba(244, 63, 94, 0.15)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: (alertsData?.open_count || 0) > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: (alertsData?.open_count || 0) > 0 ? '#fb7185' : '#818cf8',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={20} className={(alertsData?.open_count || 0) > 0 ? 'animate-bounce' : ''} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Live Student Help Alerts &amp; Consultation Requests
                </h2>
                {(alertsData?.open_count || 0) > 0 && (
                  <span className="badge badge-danger" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {alertsData.open_count} Awaiting Counsellor
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Real-time distress signals raised by students. Accept an alert to open a direct, confidential 1-on-1 support chat.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Connected Counsellor: <strong style={{ color: '#a5b4fc' }}>{counsellorName}</strong>
            </span>
          </div>
        </div>

        {/* Alerts List */}
        {!alertsData?.alerts?.length ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
            <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
            <div>No active student distress alerts at this moment. All students in balance!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alertsData.alerts.map((alert) => {
              const isOpen = alert.status === 'open';
              const isAccepted = alert.status === 'accepted';
              const isMine = alert.accepted_by === counsellorName;
              const isProcessing = acceptingId === alert.alert_id;

              return (
                <div
                  key={alert.id}
                  style={{
                    background: isOpen
                      ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(15, 23, 42, 0.6))'
                      : isAccepted
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(15, 23, 42, 0.6))'
                      : 'rgba(255,255,255,0.02)',
                    border: isOpen
                      ? '1px solid rgba(244, 63, 94, 0.35)'
                      : isAccepted
                      ? '1px solid rgba(99, 102, 241, 0.3)'
                      : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '20px',
                          background:
                            alert.urgency === 'Urgent'
                              ? 'rgba(244, 63, 94, 0.2)'
                              : alert.urgency === 'High'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(20, 184, 166, 0.2)',
                          color:
                            alert.urgency === 'Urgent'
                              ? '#fda4af'
                              : alert.urgency === 'High'
                              ? '#fde047'
                              : '#5eead4',
                          border: `1px solid ${
                            alert.urgency === 'Urgent'
                              ? 'rgba(244, 63, 94, 0.4)'
                              : alert.urgency === 'High'
                              ? 'rgba(245, 158, 11, 0.4)'
                              : 'rgba(20, 184, 166, 0.4)'
                          }`
                        }}
                      >
                        {alert.urgency} Urgency
                      </span>

                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        {alert.student_name} ({alert.student_id})
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>• {alert.department}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>• {alert.created_at}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isOpen ? 'rgba(244, 63, 94, 0.15)' : isAccepted ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isOpen ? '#fda4af' : isAccepted ? '#a5b4fc' : '#6ee7b7'
                        }}
                      >
                        {isOpen ? 'Broadcast Open' : isAccepted ? `Connected with ${alert.accepted_by}` : 'Resolved'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    <strong>Concern: </strong>
                    <span style={{ color: '#f8fafc' }}>{alert.topic}</span>
                    {alert.notes && <span style={{ color: '#94a3b8', fontStyle: 'italic', marginLeft: '6px' }}>— "{alert.notes}"</span>}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                    {isOpen && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAcceptAlert(alert)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #0d9488)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <HeartHandshake size={15} />
                        <span>Accept Request &amp; Start Live Session</span>
                      </button>
                    )}

                    {isAccepted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenExistingChat(alert)}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <MessageCircle size={15} />
                          <span>Open Live Consultation Chat ({alert.messages_count || 1})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResolveSession(alert.alert_id)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Concluded
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active 1-on-1 Consultation Chat Window Modal */}
      {activeAlertChat && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '480px',
            maxWidth: 'calc(100vw - 32px)',
            height: '600px',
            background: '#0f172a',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          {/* Chat Window Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }}
                />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  1-on-1 Consultation: {activeAlertChat.student_name}
                </h4>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                ID: {activeAlertChat.student_id} • Topic: {activeAlertChat.topic}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleResolveSession(activeAlertChat.alert_id)}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Conclude
              </button>
              <button
                type="button"
                onClick={() => setActiveAlertChat(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages Timeline */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'radial-gradient(ellipse at bottom, rgba(30, 41, 59, 0.4), rgba(11, 17, 32, 0.8))'
            }}
          >
            {chatMessages.map((m) => {
              const isCounsellor = m.sender_role === 'counsellor';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isCounsellor ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px', padding: '0 4px' }}>
                    {isCounsellor ? 'You (Counsellor)' : `${m.sender_name} (${activeAlertChat.student_id})`} • {m.timestamp}
                  </div>
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: isCounsellor ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isCounsellor ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'rgba(30, 41, 59, 0.85)',
                      color: '#f8fafc',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      border: isCounsellor ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 14px',
              background: '#0f172a',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px'
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type supportive guidance or session advice..."
              disabled={sendingMsg}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={sendingMsg || !inputMessage.trim()}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '32px'
        }}
      >
        <div className="drift-card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Consented Students
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {data?.total_students ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--teal-light)', marginTop: '4px' }}>
            100% Opted-In with Consent
          </div>
        </div>

        <div className="drift-card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Cohorts Tracked (k &ge; 5)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#a5b4fc', marginTop: '4px' }}>
            {data?.active_departments_tracked ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
            Individual Anonymity Guaranteed
          </div>
        </div>

        <div className="drift-card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Anonymity Standard
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fde047', marginTop: '4px' }}>
            k = {data?.k_anonymity_threshold ?? 5}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
            Differential Threshold Policy
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart2 size={20} color="#a5b4fc" /> Departmental Trend Breakdown
      </h2>

      {loading ? (
        <div className="drift-card" style={{ textAlign: 'center', padding: '40px' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--teal-light)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aggregating departmental metrics...</p>
        </div>
      ) : errorMsg ? (
        <div className="drift-card" style={{ color: '#fda4af', padding: '24px' }}>
          {errorMsg}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {data?.departments?.map((dept, idx) => (
            <div key={idx} className="drift-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{dept.department}</h3>
                <span className="badge badge-indigo">{dept.student_count} Students</span>
              </div>

              {/* Stress & Mood Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Stress (1-5)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: dept.avg_stress >= 3.5 ? '#fda4af' : '#6ee7b7' }}>
                    {dept.avg_stress} / 5.0
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Mood (1-5)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: dept.avg_mood >= 3.0 ? '#6ee7b7' : '#fde047' }}>
                    {dept.avg_mood} / 5.0
                  </div>
                </div>
              </div>

              {/* Elevated Stress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Elevated Stress (Stress &ge; 4):</span>
                  <span style={{ fontWeight: 700, color: dept.elevated_stress_pct > 30 ? '#fda4af' : '#cbd5e1' }}>
                    {dept.elevated_stress_pct}% of check-ins
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(dept.elevated_stress_pct, 100)}%`,
                      height: '100%',
                      background: dept.elevated_stress_pct > 30 ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' : 'linear-gradient(90deg, #10b981, #14b8a6)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

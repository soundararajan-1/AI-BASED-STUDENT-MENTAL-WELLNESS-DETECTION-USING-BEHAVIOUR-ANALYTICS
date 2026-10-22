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
            <span className="badge badge-purple">Counsellor Portal</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Strictly Anonymized Planning (k &ge; 5)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Campus Departmental Wellness Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
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
          border: (alertsData?.open_count || 0) > 0 ? '1px solid var(--muted-coral)' : '1px solid var(--border-color)',
          background: (alertsData?.open_count || 0) > 0 ? '#FFFAF8' : '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: (alertsData?.open_count || 0) > 0 ? 'var(--muted-coral)' : 'var(--muted-lavender)',
                color: (alertsData?.open_count || 0) > 0 ? '#8B2C1F' : '#5B487A',
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
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Live Student Help Alerts &amp; Consultation Requests
                </h2>
                {(alertsData?.open_count || 0) > 0 && (
                  <span className="badge badge-coral" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {alertsData.open_count} Awaiting Counsellor
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Real-time distress signals raised by students. Accept an alert to open a direct, confidential 1-on-1 support chat.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Connected Counsellor: <strong style={{ color: 'var(--primary-brand)' }}>{counsellorName}</strong>
            </span>
          </div>
        </div>

        {/* Alerts List */}
        {!alertsData?.alerts?.length ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', background: '#FAFBF9', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <CheckCircle2 size={24} color="var(--primary-brand)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No active student distress alerts at this moment.</div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>All cohorts are operating within balanced wellness parameters.</div>
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
                      ? '#FFF7F5'
                      : isAccepted
                      ? '#F9F7FD'
                      : '#FAFBF9',
                    border: isOpen
                      ? '1px solid #F1C3B6'
                      : isAccepted
                      ? '1px solid #D6CCEE'
                      : '1px solid var(--border-color)',
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
                              ? 'var(--muted-coral)'
                              : alert.urgency === 'High'
                              ? '#FFF0D4'
                              : 'var(--soft-sage)',
                          color:
                            alert.urgency === 'Urgent'
                              ? '#8B2C1F'
                              : alert.urgency === 'High'
                              ? '#8A5D00'
                              : 'var(--primary-brand)',
                          border: `1px solid ${
                            alert.urgency === 'Urgent'
                              ? '#D89A89'
                              : alert.urgency === 'High'
                              ? '#E8C589'
                              : '#BED6C3'
                          }`
                        }}
                      >
                        {alert.urgency} Urgency
                      </span>

                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {alert.student_name} ({alert.student_id})
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>• {alert.department}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {alert.created_at}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: isOpen ? '#FFEBE7' : isAccepted ? 'var(--muted-lavender)' : 'var(--soft-sage)',
                          color: isOpen ? '#8B2C1F' : isAccepted ? '#5B487A' : 'var(--primary-brand)',
                          fontWeight: 600
                        }}
                      >
                        {isOpen ? 'Broadcast Open' : isAccepted ? `Connected with ${alert.accepted_by}` : 'Resolved'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                    <strong>Concern: </strong>
                    <span>{alert.topic}</span>
                    {alert.notes && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginLeft: '6px' }}>— "{alert.notes}"</span>}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                    {isOpen && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAcceptAlert(alert)}
                        className="btn-primary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
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
                            background: '#5B487A',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
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
                            background: '#FFFFFF',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
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
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '18px',
            boxShadow: '0 16px 40px rgba(36, 51, 47, 0.16)',
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
              background: '#FAFBF9',
              borderBottom: '1px solid var(--border-color)',
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
                    background: 'var(--primary-brand)'
                  }}
                />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  1-on-1 Consultation: {activeAlertChat.student_name}
                </h4>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                ID: {activeAlertChat.student_id} • Topic: {activeAlertChat.topic}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleResolveSession(activeAlertChat.alert_id)}
                style={{
                  background: 'var(--soft-sage)',
                  color: 'var(--primary-brand)',
                  border: '1px solid #C4D9C7',
                  padding: '4px 10px',
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
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
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
              background: '#F6F5EF'
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
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px', padding: '0 4px' }}>
                    {isCounsellor ? 'You (Counsellor)' : `${m.sender_name} (${activeAlertChat.student_id})`} • {m.timestamp}
                  </div>
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: isCounsellor ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isCounsellor ? 'var(--primary-brand)' : '#FFFFFF',
                      color: isCounsellor ? '#ffffff' : 'var(--text-main)',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      border: isCounsellor ? 'none' : '1px solid var(--border-color)',
                      boxShadow: '0 1px 4px rgba(36, 51, 47, 0.05)'
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
              background: '#FFFFFF',
              borderTop: '1px solid var(--border-color)',
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
                background: '#FAFBF9',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={sendingMsg || !inputMessage.trim()}
              className="btn-primary"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '13px',
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
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
            Total Consented Students
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-brand)', marginTop: '4px' }}>
            {data?.total_students ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            100% Opted-In with Consent
          </div>
        </div>

        <div className="drift-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
            Cohorts Tracked (k &ge; 5)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#5B487A', marginTop: '4px' }}>
            {data?.active_departments_tracked ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Individual Anonymity Guaranteed
          </div>
        </div>

        <div className="drift-card">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
            Anonymity Standard
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#9C4D35', marginTop: '4px' }}>
            k = {data?.k_anonymity_threshold ?? 5}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Differential Threshold Policy
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
        <BarChart2 size={20} color="var(--primary-brand)" /> Departmental Trend Breakdown
      </h2>

      {loading ? (
        <div className="drift-card" style={{ textAlign: 'center', padding: '40px' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary-brand)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aggregating departmental metrics...</p>
        </div>
      ) : errorMsg ? (
        <div className="drift-card" style={{ color: '#8B2C1F', background: '#FFF0ED', padding: '24px' }}>
          {errorMsg}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {data?.departments?.map((dept, idx) => (
            <div key={idx} className="drift-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{dept.department}</h3>
                <span className="badge badge-purple">{dept.student_count} Students</span>
              </div>

              {/* Stress & Mood Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#FAFBF9', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Avg Stress (1-5)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: dept.avg_stress >= 3.5 ? '#8B2C1F' : 'var(--primary-brand)' }}>
                    {dept.avg_stress} / 5.0
                  </div>
                </div>

                <div style={{ background: '#FAFBF9', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Avg Mood (1-5)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: dept.avg_mood >= 3.0 ? 'var(--primary-brand)' : '#8A5D00' }}>
                    {dept.avg_mood} / 5.0
                  </div>
                </div>
              </div>

              {/* Elevated Stress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Elevated Stress (Stress &ge; 4):</span>
                  <span style={{ fontWeight: 700, color: dept.elevated_stress_pct > 30 ? '#8B2C1F' : 'var(--text-main)' }}>
                    {dept.elevated_stress_pct}% of check-ins
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--soft-sage)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(dept.elevated_stress_pct, 100)}%`,
                      height: '100%',
                      background: dept.elevated_stress_pct > 30 ? 'var(--muted-coral)' : 'var(--primary-brand)',
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

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Send,
  X,
  PhoneCall,
  ShieldCheck,
  CheckCircle,
  Clock,
  UserCheck,
  Radio,
  HeartHandshake,
  MessageSquare
} from 'lucide-react';
import {
  raiseCounsellorAlert,
  fetchStudentActiveAlert,
  fetchAlertMessages,
  sendAlertMessage,
  resolveCounsellorAlert
} from '../api';

export default function StudentCounsellorAlertModal({
  isOpen,
  onClose,
  studentId,
  studentDepartment = 'General',
  studentName = ''
}) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [loadingActive, setLoadingActive] = useState(false);
  const [urgency, setUrgency] = useState('moderate');
  const [topic, setTopic] = useState('Academic Stress & Overwhelm');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  const checkActiveAlert = async () => {
    if (!studentId) return;
    try {
      const res = await fetchStudentActiveAlert(studentId);
      if (res.active_alert) {
        setActiveAlert(res.active_alert);
        // Load messages if accepted
        if (res.active_alert.status === 'accepted') {
          const msgRes = await fetchAlertMessages(res.active_alert.alert_id);
          setMessages(msgRes.messages || []);
        }
      } else {
        setActiveAlert(null);
      }
    } catch (err) {
      console.error('Error checking active alert:', err);
    }
  };

  // Poll active alert and chat messages when modal is open
  useEffect(() => {
    if (isOpen) {
      setLoadingActive(true);
      checkActiveAlert().finally(() => setLoadingActive(false));

      const interval = setInterval(() => {
        checkActiveAlert();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isOpen, studentId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleRaiseAlert = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await raiseCounsellorAlert({
        student_id: studentId,
        student_name: studentName || studentId,
        department: studentDepartment || 'General',
        urgency,
        topic,
        notes
      });
      setActiveAlert(res.alert || res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to raise alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeAlert || sendingMsg) return;

    setSendingMsg(true);
    try {
      const sent = await sendAlertMessage(activeAlert.alert_id, {
        sender_role: 'student',
        sender_name: studentName || studentId,
        sender_id: studentId,
        message: newMessage.trim()
      });
      setMessages((prev) => [...prev, sent.message || sent]);
      setNewMessage('');
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!activeAlert) return;
    if (!window.confirm('Are you sure you want to end and resolve this consultation session?')) return;

    try {
      await resolveCounsellorAlert(activeAlert.alert_id);
      setActiveAlert(null);
      setMessages([]);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to conclude consultation');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: activeAlert?.status === 'accepted' ? '680px' : '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background:
                  activeAlert?.status === 'accepted'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : activeAlert?.status === 'open'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(244, 63, 94, 0.15)',
                color:
                  activeAlert?.status === 'accepted'
                    ? '#34d399'
                    : activeAlert?.status === 'open'
                    ? '#f87171'
                    : '#fda4af',
                padding: '10px',
                borderRadius: '10px'
              }}
            >
              {activeAlert?.status === 'accepted' ? (
                <HeartHandshake size={24} />
              ) : (
                <Radio size={24} className={activeAlert?.status === 'open' ? 'pulse-anim' : ''} />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                {activeAlert?.status === 'accepted'
                  ? 'Live 1-on-1 Counsellor Consultation'
                  : activeAlert?.status === 'open'
                  ? 'Distress Alert Broadcast Active'
                  : 'Raise Campus Counsellor Alert'}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                {activeAlert?.status === 'accepted'
                  ? `Connected with ${activeAlert.accepted_by || 'Campus Counsellor'}`
                  : activeAlert?.status === 'open'
                  ? 'Awaiting response from campus counsellors'
                  : 'Broadcast a direct help request to all available campus counsellors'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* STATE 1: Connected Live 1-on-1 Chat */}
          {activeAlert && activeAlert.status === 'accepted' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} /> Active Session • Topic: {activeAlert.topic}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '2px' }}>
                    Consulting with: <strong>{activeAlert.accepted_by}</strong> (Confidential & Private)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResolveAlert}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Conclude Session
                </button>
              </div>

              {/* Chat Message Thread */}
              <div
                style={{
                  background: 'rgba(10, 15, 29, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: '260px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '14px'
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: 'auto' }}>
                    <MessageSquare size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <div>Connected! Say hello to your counsellor. They are here to support you.</div>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender_role === 'student';
                    return (
                      <div
                        key={m.id || idx}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginBottom: '2px',
                            padding: '0 4px'
                          }}
                        >
                          {isMe ? 'You (Student)' : m.sender_name || 'Counsellor'} •{' '}
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div
                          style={{
                            background: isMe
                              ? 'linear-gradient(135deg, #14b8a6, #0d9488)'
                              : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                            color: '#ffffff',
                            padding: '10px 14px',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            fontSize: '13px',
                            lineHeight: '1.45',
                            wordBreak: 'break-word',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Type your message to counsellor..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !newMessage.trim()}
                  className="btn-primary"
                  style={{
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    opacity: sendingMsg || !newMessage.trim() ? 0.6 : 1
                  }}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : activeAlert && activeAlert.status === 'open' ? (
            /* STATE 2: Alert Open & Broadcasting */
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#f87171'
                }}
              >
                <Radio size={32} />
              </div>

              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                Broadcasting to All Campus Counsellors
              </h4>
              <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Your request has been prioritized and broadcast to on-duty counsellors. The moment any counsellor accepts,
                this modal will automatically switch to a private 1-on-1 live chat.
              </p>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'left',
                  maxWidth: '440px',
                  margin: '0 auto 20px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Alert ID:</span>
                  <span style={{ fontFamily: 'monospace', color: '#2dd4bf' }}>{activeAlert.alert_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Urgency:</span>
                  <span
                    style={{
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color:
                        activeAlert.urgency === 'urgent'
                          ? '#f87171'
                          : activeAlert.urgency === 'moderate'
                          ? '#fbbf24'
                          : '#34d399'
                    }}
                  >
                    {activeAlert.urgency}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Topic:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{activeAlert.topic}</span>
                </div>
                {activeAlert.notes && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: '#94a3b8' }}>Notes: </span>
                    <span style={{ color: '#e2e8f0' }}>{activeAlert.notes}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleResolveAlert}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Withdraw Request
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3: Create and Broadcast Alert Form */
            <form onSubmit={handleRaiseAlert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#fda4af',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Raising an alert sends a real-time notification to all campus counsellors currently monitoring the portal.
                  Counsellors can immediately accept and open a live private chat with you.
                </span>
              </div>

              {errorMsg && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Urgency Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'mild', label: 'Mild', desc: 'Advice & Planning', color: '#34d399' },
                    { id: 'moderate', label: 'Moderate', desc: 'Feeling Overwhelmed', color: '#fbbf24' },
                    { id: 'urgent', label: 'Urgent', desc: 'Need immediate help', color: '#f87171' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setUrgency(lvl.id)}
                      style={{
                        background: urgency === lvl.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: urgency === lvl.id ? `2px solid ${lvl.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: lvl.color }}>{lvl.label}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  What are you experiencing?
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="Academic Stress & Overwhelm" style={{ background: '#131d33', color: '#fff' }}>
                    Academic Stress & Overwhelm
                  </option>
                  <option value="Sleep Deprivation & Exhaustion" style={{ background: '#131d33', color: '#fff' }}>
                    Sleep Deprivation & Exhaustion
                  </option>
                  <option value="Anxiety & Panic Symptoms" style={{ background: '#131d33', color: '#fff' }}>
                    Anxiety & Panic Symptoms
                  </option>
                  <option value="Isolation & Feeling Disconnected" style={{ background: '#131d33', color: '#fff' }}>
                    Isolation & Feeling Disconnected
                  </option>
                  <option value="Personal / Family Emergency" style={{ background: '#131d33', color: '#fff' }}>
                    Personal / Family Emergency
                  </option>
                  <option value="General Check-in & Guidance" style={{ background: '#131d33', color: '#fff' }}>
                    General Check-in & Guidance
                  </option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any context that helps the counsellor prepare (e.g. have an exam tomorrow, haven't slept in two days)..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  <Radio size={16} />
                  <span>{submitting ? 'Broadcasting Alert...' : 'Broadcast Alert to All Counsellors'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

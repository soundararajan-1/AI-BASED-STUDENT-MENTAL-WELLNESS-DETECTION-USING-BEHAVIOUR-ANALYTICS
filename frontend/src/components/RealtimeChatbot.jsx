import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  Heart,
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Key,
  CheckCircle,
  User,
  Bot,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { sendStudentChat, bookCounsellorSession, verifyGeminiKey } from '../api';

const QUICK_PROMPTS = [
  { id: 'stress', text: 'Why is my stress trending higher recently?' },
  { id: 'sleep', text: 'How does my sleep compare to my personal baseline?' },
  { id: 'counsellor', text: 'I feel overwhelmed with studies. Can I connect with a counsellor?' },
  { id: 'balance', text: 'What daily habits give me the best balance?' }
];

export default function RealtimeChatbot({ studentId, isFloating = false, onClose = null }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm Drift, your real-time wellness companion. I analyze your daily habits against your own personal baseline rather than generic rules. How are you feeling today?",
      data_basis: 'Real-time personal baseline engine active',
      suggestions: [
        'Ask about your recent sleep shifts',
        'Check what changed in your study hours',
        'Request campus counsellor guidance if feeling overwhelmed'
      ],
      encouragement: "I'm here to support your daily rhythm with zero judgment.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      llm_status: 'ready'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('drift_gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [keyStatus, setKeyStatus] = useState(apiKey ? 'configured' : 'env_default');
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  // Counsellor Booking Form State
  const [bookingMsgId, setBookingMsgId] = useState(null);
  const [bookingSlot, setBookingSlot] = useState('Tomorrow 10:00 AM');
  const [bookingUrgency, setBookingUrgency] = useState('Normal');
  const [bookingNote, setBookingNote] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, bookingMsgId]);

  // Handle Key Verification
  const handleVerifyKey = async () => {
    if (!tempApiKey.trim()) {
      localStorage.removeItem('drift_gemini_api_key');
      setApiKey('');
      setKeyStatus('env_default');
      setKeyMessage('Cleared custom key. Using backend environment configuration.');
      return;
    }
    setKeyTesting(true);
    setKeyMessage('');
    try {
      const res = await verifyGeminiKey(tempApiKey.trim());
      localStorage.setItem('drift_gemini_api_key', tempApiKey.trim());
      setApiKey(tempApiKey.trim());
      setKeyStatus('active');
      setKeyMessage(`Verified! Connected to ${res.model}.`);
      setTimeout(() => setApiKeyModalOpen(false), 1500);
    } catch (err) {
      setKeyStatus('error');
      setKeyMessage(err.message || 'Key validation failed. Please check key.');
    } finally {
      setKeyTesting(false);
    }
  };

  // Perform Chat Message Send
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsgId = 'msg-' + Date.now();
    const newMsg = {
      id: userMsgId,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);
    setStreamingText('');

    // Prepare API history format
    const historyPayload = updatedHistory
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }));

    try {
      // Simulate real-time streaming preview typing while awaiting API
      let typingInterval = null;
      let dots = 0;
      typingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        setStreamingText('Thinking' + '.'.repeat(dots));
      }, 250);

      const res = await sendStudentChat(studentId, {
        question: text,
        history: historyPayload,
        apiKey: apiKey || null
      });

      clearInterval(typingInterval);
      setStreamingText('');

      const assistantMsg = {
        id: 'resp-' + Date.now(),
        role: 'assistant',
        text: res.answer,
        data_basis: res.data_basis,
        suggestions: res.suggestions || [],
        encouragement: res.encouragement,
        disclaimer: res.disclaimer,
        llm_status: res.llm_status,
        recommend_counsellor: res.recommend_counsellor,
        counsellor_urgency: res.counsellor_urgency,
        counsellor_reason: res.counsellor_reason,
        counsellor_info: res.counsellor_info,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If counsellor is recommended, expand booking form automatically for convenient support
      if (res.recommend_counsellor) {
        setBookingMsgId(assistantMsg.id);
      }
    } catch (err) {
      setStreamingText('');
      const errorMsg = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: "I couldn't reach the analysis server. Please ensure the backend is running at http://127.0.0.1:8000.",
        suggestions: ['Retry your question', 'Check server connection'],
        encouragement: 'Your data is safe and will reload once connection resumes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        llm_status: 'error'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle in-chat counsellor booking
  const handleConfirmBooking = async (msgId) => {
    setBookingSubmitting(true);
    try {
      const res = await bookCounsellorSession({
        studentId,
        slot: bookingSlot,
        urgency: bookingUrgency,
        note: bookingNote
      });
      setConfirmedBookings((prev) => ({
        ...prev,
        [msgId]: res
      }));
    } catch (err) {
      alert(err.message || 'Could not complete booking.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div
      className="drift-card"
      id="realtime-chatbot"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFloating ? '540px' : '620px',
        padding: '0',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.65)',
        position: 'relative'
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
              padding: '8px',
              borderRadius: '12px',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Bot size={22} />
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #0f172a'
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Drift Real-Time Assistant
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  color: '#2dd4bf',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} />
                Gemini Powered
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Personalized wellness queries &amp; campus counsellor referral
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Gemini Key Config Button */}
          <button
            type="button"
            onClick={() => setApiKeyModalOpen(true)}
            style={{
              background: apiKey ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: apiKey ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: apiKey ? '#a5b4fc' : '#94a3b8',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
            title="Configure or enter your Gemini API Key"
          >
            <Key size={13} />
            <span>{apiKey ? 'Gemini Key Configured' : 'Set Gemini Key'}</span>
          </button>

          {/* Close button if floating */}
          {isFloating && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
              title="Close Chat"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* API Key Modal Popup */}
      {apiKeyModalOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 17, 32, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#131d33',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc' }}>
                <Key size={18} />
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  Gemini API Configuration
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setApiKeyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.5' }}>
              Enter your Google Gemini API key to generate streaming responses powered by Gemini 3.8 Flash.
              If omitted, Drift seamlessly uses the grounded zero-failure generative synthesizer.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px' }}>
                Gemini API Key
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {keyMessage && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  marginBottom: '14px',
                  background: keyStatus === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: keyStatus === 'active' ? '#34d399' : '#fb7185',
                  border: `1px solid ${keyStatus === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                }}
              >
                {keyMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setTempApiKey('');
                  localStorage.removeItem('drift_gemini_api_key');
                  setApiKey('');
                  setKeyStatus('env_default');
                  setKeyMessage('Reset to environment key.');
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear / Reset
              </button>
              <button
                type="button"
                onClick={handleVerifyKey}
                disabled={keyTesting}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {keyTesting ? <Loader2 size={14} className="spin-slow" /> : <CheckCircle size={14} />}
                Test &amp; Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message History Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'radial-gradient(ellipse at bottom, rgba(30, 41, 59, 0.4), rgba(11, 17, 32, 0.8))'
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '100%'
            }}
          >
            {/* Sender Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                fontSize: '11px',
                color: '#94a3b8',
                paddingLeft: msg.role === 'user' ? 0 : '4px',
                paddingRight: msg.role === 'user' ? '4px' : 0
              }}
            >
              {msg.role === 'user' ? (
                <>
                  <span>You ({studentId})</span>
                  <User size={12} color="#818cf8" />
                </>
              ) : (
                <>
                  <Bot size={12} color="#2dd4bf" />
                  <span>Drift AI</span>
                  {msg.llm_status && (
                    <span
                      style={{
                        fontSize: '9px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}
                    >
                      {msg.llm_status.replace(/_/g, ' ')}
                    </span>
                  )}
                </>
              )}
              <span style={{ fontSize: '10px', opacity: 0.6 }}>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: '85%',
                padding: '14px 18px',
                borderRadius:
                  msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, #4f46e5, #4338ca)'
                    : 'rgba(30, 41, 59, 0.85)',
                color: '#f8fafc',
                border:
                  msg.role === 'user'
                    ? '1px solid rgba(99, 102, 241, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow:
                  msg.role === 'user'
                    ? '0 4px 16px rgba(79, 70, 229, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.3)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

              {/* Data Basis Evidence Receipt */}
              {msg.data_basis && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#94a3b8'
                  }}
                >
                  <ShieldCheck size={13} color="#2dd4bf" />
                  <span>{msg.data_basis}</span>
                </div>
              )}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#fbbf24',
                      marginBottom: '6px'
                    }}
                  >
                    <Lightbulb size={12} />
                    <span>Actionable Balance Suggestions:</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1' }}>
                    {msg.suggestions.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Encouragement */}
              {msg.encouragement && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#a5b4fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Heart size={12} color="#f43f5e" />
                  <span>{msg.encouragement}</span>
                </div>
              )}
            </div>

            {/* Counsellor Recommendation Alert Card */}
            {msg.recommend_counsellor && (
              <div
                style={{
                  marginTop: '12px',
                  maxWidth: '88%',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(99, 102, 241, 0.12))',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 8px 24px rgba(244, 63, 94, 0.15)'
                }}
              >
                {/* Banner Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div
                    style={{
                      background: 'rgba(244, 63, 94, 0.2)',
                      padding: '6px',
                      borderRadius: '8px',
                      color: '#fb7185'
                    }}
                  >
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fda4af', margin: 0 }}>
                      🩺 Campus Counsellor Recommended
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {msg.counsellor_urgency === 'firm' ? 'Priority Support Protocol' : 'Personalized Support Referral'}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '12px', lineHeight: '1.5' }}>
                  {msg.counsellor_reason || 'We noticed shifts in your recent check-in patterns. You do not have to handle university stress alone.'}
                </p>

                {/* Counsellor Profile Details */}
                {msg.counsellor_info && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '12px',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} color="#2dd4bf" />
                      <strong>{msg.counsellor_info.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#a5b4fc" />
                      <span>{msg.counsellor_info.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="#fbbf24" />
                      <span>{msg.counsellor_info.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="#34d399" />
                      <span>{msg.counsellor_info.hours}</span>
                    </div>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingMsgId(bookingMsgId === msg.id ? null : msg.id)}
                    style={{
                      background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Calendar size={13} />
                    <span>{bookingMsgId === msg.id ? 'Hide Booking Form' : '📅 Book Confidential Session'}</span>
                  </button>

                  <a
                    href="tel:988"
                    style={{
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#fda4af',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Phone size={13} />
                    <span>Call 988 (24/7 Free)</span>
                  </a>

                  <a
                    href="mailto:counsellor@campus.edu?subject=Confidential%20Student%20Support%20Inquiry"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Mail size={13} />
                    <span>Email Counsellor</span>
                  </a>
                </div>

                {/* Expandable In-Chat Booking Form */}
                {bookingMsgId === msg.id && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '10px',
                      border: '1px solid rgba(20, 184, 166, 0.3)'
                    }}
                  >
                    {confirmedBookings[msg.id] ? (
                      <div style={{ textAlign: 'center', padding: '10px' }}>
                        <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                          <CheckCircle size={20} />
                          <strong style={{ fontSize: '14px' }}>Session Reserved ({confirmedBookings[msg.id].booking_id})</strong>
                        </div>
                        <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
                          {confirmedBookings[msg.id].message}
                        </p>
                      </div>
                    ) : (
                      <>
                        <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#2dd4bf', marginBottom: '8px' }}>
                          Request Confidential Campus Meeting
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                              Preferred Slot
                            </label>
                            <select
                              value={bookingSlot}
                              onChange={(e) => setBookingSlot(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: '#1e293b',
                                color: '#f8fafc',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontSize: '11px'
                              }}
                            >
                              <option value="Tomorrow 10:00 AM">Tomorrow Morning (10:00 AM)</option>
                              <option value="Tomorrow 2:00 PM">Tomorrow Afternoon (2:00 PM)</option>
                              <option value="Same-Day Walk-in (1:00 PM - 3:00 PM)">Same-Day Walk-in</option>
                              <option value="Next Available Slot">Next Available</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                              Urgency Level
                            </label>
                            <select
                              value={bookingUrgency}
                              onChange={(e) => setBookingUrgency(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: '#1e293b',
                                color: '#f8fafc',
                                border: '1px solid rgba(255,255,255,0.1)',
                                fontSize: '11px'
                              }}
                            >
                              <option value="Normal">Routine Check-in</option>
                              <option value="Elevated">Elevated Stress / Exam Support</option>
                              <option value="Urgent">Urgent / Same-day Priority</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <input
                            type="text"
                            value={bookingNote}
                            onChange={(e) => setBookingNote(e.target.value)}
                            placeholder="Optional note (e.g. feeling stressed about exams)"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#1e293b',
                              color: '#f8fafc',
                              border: '1px solid rgba(255,255,255,0.1)',
                              fontSize: '11px'
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(msg.id)}
                          disabled={bookingSubmitting}
                          style={{
                            background: '#14b8a6',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {bookingSubmitting ? <Loader2 size={12} className="spin-slow" /> : <CheckCircle size={12} />}
                          Confirm My Confidential Session
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Real-time Streaming typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '12px' }}>
            <Loader2 size={14} className="spin-slow" />
            <span>{streamingText || 'Drift is reviewing your baseline data...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div
        style={{
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSendMessage(p.text)}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
          >
            {p.text}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '12px 16px',
          background: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Drift about your stress, sleep patterns, or request guidance..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #14b8a6)' : 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 18px',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            boxShadow: input.trim() && !loading ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none'
          }}
        >
          {loading ? <Loader2 size={16} className="spin-slow" /> : <Send size={16} />}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

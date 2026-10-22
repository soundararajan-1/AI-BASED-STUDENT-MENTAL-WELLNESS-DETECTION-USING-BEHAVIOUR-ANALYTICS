import React, { useState, useEffect } from 'react';
import {
  Compass,
  Shield,
  LifeBuoy,
  BarChart2,
  Trash2,
  Calendar,
  AlertTriangle,
  Heart,
  PhoneCall,
  UserCheck,
  RefreshCw,
  Building2,
  SlidersHorizontal,
  MessageCircle,
  Radio,
  LogOut,
  Lock,
  Key,
  User
} from 'lucide-react';

import {
  fetchDashboard,
  fetchInsight,
  fetchTimeline,
  createStudent,
  fetchStudentActiveAlert
} from './api';

import ConsentModal from './components/ConsentModal';
import CheckinWidget from './components/CheckinWidget';
import FingerprintRadar from './components/FingerprintRadar';
import WhatChangedCard from './components/WhatChangedCard';
import QuietDriftCard from './components/QuietDriftCard';
import PatternCard from './components/PatternCard';
import AiInsightCard from './components/AiInsightCard';
import TimelineCard from './components/TimelineCard';
import PersonalLeversCard from './components/PersonalLeversCard';
import PatternMemoryCard from './components/PatternMemoryCard';
import TimeTravelSlider from './components/TimeTravelSlider';
import AskDriftCard from './components/AskDriftCard';
import RealtimeChatbot from './components/RealtimeChatbot';
import CounsellorModal from './components/CounsellorModal';
import EvaluationModal from './components/EvaluationModal';
import DeleteDataModal from './components/DeleteDataModal';
import StudentCounsellorAlertModal from './components/StudentCounsellorAlertModal';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CounsellorPortalPage from './pages/CounsellorPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('drift_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = sessionStorage.getItem('drift_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'student') return 'dashboard';
        if (parsed.role === 'counsellor') return 'counsellor';
        if (parsed.role === 'admin') return 'admin';
      }
    } catch {}
    return 'login';
  });
  const [studentId, setStudentId] = useState(() => {
    try {
      const saved = sessionStorage.getItem('drift_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user?.student_id || 'S001';
      }
    } catch {}
    return 'S001';
  });
  const [asOfDate, setAsOfDate] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [insight, setInsight] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [consentOpen, setConsentOpen] = useState(false);
  const [counsellorOpen, setCounsellorOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [manualSupportTriggered, setManualSupportTriggered] = useState(false);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [activeAlertSummary, setActiveAlertSummary] = useState(null);

  // Poll for student active counsellor alert status
  useEffect(() => {
    if (!studentId) return;
    const pollAlert = () => {
      fetchStudentActiveAlert(studentId)
        .then((res) => setActiveAlertSummary(res.active_alert || null))
        .catch(() => {});
    };
    pollAlert();
    const timer = setInterval(pollAlert, 3500);
    return () => clearInterval(timer);
  }, [studentId]);

  // Load dashboard data
  const loadData = async (sid = studentId, date = asOfDate) => {
    setLoading(true);
    try {
      const dash = await fetchDashboard(sid, date);
      setDashboard(dash);
      if (!date && dash.as_of) {
        setAsOfDate(dash.as_of);
      }

      // Load insight
      fetchInsight(sid, date)
        .then(setInsight)
        .catch(console.error);

      // Load timeline
      fetchTimeline(sid)
        .then((res) => setTimeline(res.weeks))
        .catch(console.error);
    } catch (err) {
      console.error(err);
      // If student not found, prompt consent setup
      setConsentOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(studentId, asOfDate);
  }, [studentId, asOfDate]);

  const handleConsentGranted = async (profileData) => {
    try {
      await createStudent(profileData);
      setStudentId(profileData.student_id);
      setConsentOpen(false);
      loadData(profileData.student_id, null);
    } catch (err) {
      alert(err.message || 'Error creating profile');
    }
  };

  const handleDataDeleted = () => {
    setDashboard(null);
    setInsight(null);
    setTimeline(null);
    setConsentOpen(true);
  };

  const safetyInfo = dashboard?.safety || {};
  const isSafetyActive = safetyInfo.triggered || manualSupportTriggered;
  const counsellorContact = safetyInfo.counsellor_info;

  // Concern level badge calculation
  const getConcernBadge = () => {
    if (safetyInfo.level === 'firm' || manualSupportTriggered) {
      return { text: 'Support Recommended', class: 'badge-danger' };
    }
    if (dashboard?.drift?.has_drift || safetyInfo.level === 'soft') {
      return { text: 'Quiet Shift Noticed', class: 'badge-warning' };
    }
    return { text: 'Balanced Normal', class: 'badge-teal' };
  };

  const handleLoginSuccess = (authData) => {
    setCurrentUser(authData);
    try {
      sessionStorage.setItem('drift_auth', JSON.stringify(authData));
    } catch {}
    if (authData.role === 'student') {
      const sid = authData.user?.student_id || 'S001';
      setStudentId(sid);
      setCurrentView('dashboard');
      loadData(sid, null);
    } else if (authData.role === 'counsellor') {
      setCurrentView('counsellor');
    } else if (authData.role === 'admin') {
      setCurrentView('admin');
    }
  };

  const handleSwitchAccount = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('drift_auth');
    } catch {}
    setCurrentView('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('drift_auth');
    } catch {}
    setCurrentView('login');
  };

  const concernBadge = getConcernBadge();

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Global Navigation Bar - Secure & Role-Scoped */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        padding: '12px 18px',
        background: 'rgba(19, 29, 51, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #14b8a6, #6366f1)',
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)'
          }}>
            <Compass size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>AI-Based Student Wellness Detection</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentUser
                ? `${currentUser.role.toUpperCase()} PORTAL • ACTIVE SESSION`
                : 'AUTHENTICATION GATE • SECURE ACCESS REQUIRED'}
            </div>
          </div>
        </div>

        {/* User Session Chip & Role Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentUser ? (
            <>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background:
                    currentUser.role === 'student'
                      ? 'rgba(20, 184, 166, 0.15)'
                      : currentUser.role === 'counsellor'
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                  color:
                    currentUser.role === 'student'
                      ? 'var(--teal-light)'
                      : currentUser.role === 'counsellor'
                      ? '#a5b4fc'
                      : '#fde047',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {currentUser.role === 'student' && `🎓 Student: ${currentUser.user?.student_id || studentId}`}
                {currentUser.role === 'counsellor' && `🩺 Counsellor: ${currentUser.user?.name || 'Staff'}`}
                {currentUser.role === 'admin' && `🛡️ Administrator: ${currentUser.user?.email || 'admin'}`}
              </span>

              <button
                type="button"
                onClick={handleSwitchAccount}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Switch to another account (Password login required)"
              >
                <Key size={13} />
                <span>Switch Account</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fda4af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Sign out of current account"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <Lock size={14} color="var(--teal-light)" />
              <span>Please sign in with your credentials</span>
            </div>
          )}
        </div>
      </nav>

      {/* Primary View Routing - No Public Unauthenticated Demos */}
      {!currentUser || currentView === 'login' ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : currentView === 'counsellor' && currentUser?.role === 'counsellor' ? (
        <CounsellorPortalPage counsellorUser={currentUser?.user} onBackToHome={handleSwitchAccount} />
      ) : currentView === 'admin' && currentUser?.role === 'admin' ? (
        <AdminPortalPage adminUser={currentUser?.user} onBackToHome={handleSwitchAccount} />
      ) : (
        <>
          {/* Top Header */}
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #14b8a6, #6366f1)',
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)'
          }}>
            <Compass size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Drift</h1>
              <span className="badge badge-teal" style={{ fontSize: '10px' }}>Personal Early-Warning</span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              We notice when you quietly drift from your own normal.
            </p>
          </div>
        </div>

        {/* Header Actions & Student Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '12px'
          }}>
            <UserCheck size={16} color="#2dd4bf" />
            <span>ID: <strong>{studentId}</strong></span>
            {dashboard?.student?.department && (
              <span style={{ color: '#94a3b8' }}>• {dashboard.student.department}</span>
            )}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setEvalOpen(true)}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart2 size={15} />
            <span>Evaluation Results</span>
          </button>

          {/* Counsellor Alert Action */}
          <button
            type="button"
            id="raise-counsellor-alert-btn"
            onClick={() => setAlertModalOpen(true)}
            style={{
              background:
                activeAlertSummary?.status === 'accepted'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : activeAlertSummary?.status === 'open'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'rgba(239, 68, 68, 0.15)',
              border:
                activeAlertSummary
                  ? '1px solid transparent'
                  : '1px solid rgba(239, 68, 68, 0.35)',
              color: activeAlertSummary ? '#ffffff' : '#fda4af',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeAlertSummary ? '0 0 16px rgba(239, 68, 68, 0.45)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title="Broadcast emergency/distress alert to campus counsellors"
          >
            <Radio size={15} className={activeAlertSummary?.status === 'open' ? 'pulse-anim' : ''} />
            <span>
              {activeAlertSummary?.status === 'accepted'
                ? '🟢 Counsellor Connected (Chat)'
                : activeAlertSummary?.status === 'open'
                ? '🚨 Alert Broadcasting...'
                : '🚨 Counsellor Alert'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setManualSupportTriggered(true)}
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LifeBuoy size={15} />
            <span>Need Support?</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDeleteOpen(true)}
            style={{ padding: '8px', color: '#94a3b8' }}
            title="Privacy: Delete my data"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Safety Alert Banner */}
      {isSafetyActive && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(245, 158, 11, 0.15))',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div style={{
            background: '#f43f5e',
            color: '#fff',
            padding: '10px',
            borderRadius: '12px',
            flexShrink: 0
          }}>
            <Heart size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fda4af' }}>
                Supportive Care & Campus Connection
              </h3>
              {manualSupportTriggered && (
                <button
                  type="button"
                  onClick={() => setManualSupportTriggered(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                >
                  Dismiss
                </button>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: '1.5', marginBottom: '12px' }}>
              {manualSupportTriggered
                ? "You reached out for support. You don't have to carry stressful moments on your own. Confidential campus and community contacts are ready for you right now."
                : safetyInfo.message}
            </p>
            {counsellorContact && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
                fontSize: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '12px',
                borderRadius: '10px',
                color: '#cbd5e1'
              }}>
                <div>
                  <strong style={{ color: '#2dd4bf' }}>{counsellorContact.title}</strong>
                  <p>{counsellorContact.location}</p>
                </div>
                <div>
                  <p><strong>Phone:</strong> {counsellorContact.phone}</p>
                  <p><strong>Email:</strong> {counsellorContact.email}</p>
                </div>
                <div>
                  <p style={{ color: '#fbbf24', fontWeight: '700' }}>{counsellorContact.helpline_24_7}</p>
                  <p>{counsellorContact.hours}</p>
                </div>
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setAlertModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                <Radio size={14} className={activeAlertSummary?.status === 'open' ? 'pulse-anim' : ''} />
                <span>
                  {activeAlertSummary?.status === 'accepted'
                    ? '🟢 Enter Live 1-on-1 Counsellor Session'
                    : activeAlertSummary?.status === 'open'
                    ? '🚨 View Broadcast Status (Pending Acceptance)'
                    : '🚨 Broadcast Distress Alert to All Campus Counsellors'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wellness Overview Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`badge ${concernBadge.class}`}>
            {concernBadge.text}
          </span>
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
            Day <strong>{dashboard?.total_days_tracked || 1}</strong> of personal wellness tracking
          </span>
        </div>

        {/* Baseline Confidence Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Baseline Confidence</span>
              <strong style={{ color: '#2dd4bf' }}>{Math.round((dashboard?.overall_confidence || 0) * 100)}%</strong>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((dashboard?.overall_confidence || 0) * 100)}%`,
                background: 'linear-gradient(90deg, #14b8a6, #6366f1)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {dashboard?.overall_confidence >= 1.0 ? 'Cold-Start Cleared' : 'Learning Normal'}
          </span>
        </div>
      </div>

      {/* Time-Travel Demo Slider (For S001) */}
      {studentId === 'S001' && dashboard?.available_dates && (
        <TimeTravelSlider
          availableDates={dashboard.available_dates}
          currentDate={asOfDate || dashboard.as_of}
          onDateChange={(newDate) => setAsOfDate(newDate)}
        />
      )}

      {/* Main Grid Layout */}
      <main style={{ flex: 1 }}>
        {/* Row 1: Check-in Widget & AI Insight with Receipts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <CheckinWidget
            studentId={studentId}
            asOfDate={asOfDate || dashboard?.as_of}
            todayCheckin={dashboard?.today_checkin}
            isAlreadyCheckedIn={dashboard?.checked_in_today}
            onCheckinComplete={() => loadData(studentId, asOfDate)}
          />

          <AiInsightCard insightData={insight} />
        </div>

        {/* Interactive AI Query: Ask Drift */}
        <AskDriftCard studentId={studentId} />

        {/* Row 2: Fingerprint Radar (7 Axes) & What Changed (Deltas) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <FingerprintRadar radarData={dashboard?.radar} />
          <WhatChangedCard whatChanged={dashboard?.what_changed} />
        </div>

        {/* Row 3: Quiet Drift Alert (CUSUM) & Detected Pattern */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <QuietDriftCard driftData={dashboard?.drift} />
          <PatternCard patternData={dashboard?.pattern} />
        </div>

        {/* Row 4: Longitudinal Timeline */}
        {timeline && <TimelineCard timelineWeeks={timeline} />}

        {/* Row 5: Supporting Personal Levers & Pattern Memory */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <PersonalLeversCard leversData={dashboard?.levers} />
          <PatternMemoryCard memoryData={dashboard?.memory} />
        </div>
      </main>

      {/* Universal Mandatory Footer */}
      <footer style={{
        marginTop: 'auto',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        <p style={{ fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
          Educational wellness-support prototype. Not a medical diagnostic tool.
        </p>
        <p>
          Drift uses personalized median bands, CUSUM drift detection, and validated explanation receipts. All rights reserved.
        </p>
      </footer>
        </>
      )}

      {/* Modals */}
      <ConsentModal
        isOpen={consentOpen}
        onConsentGranted={handleConsentGranted}
      />

      <CounsellorModal
        isOpen={counsellorOpen}
        onClose={() => setCounsellorOpen(false)}
      />

      <EvaluationModal
        isOpen={evalOpen}
        onClose={() => setEvalOpen(false)}
      />

      <DeleteDataModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        studentId={studentId}
        onDeleted={handleDataDeleted}
      />

      <StudentCounsellorAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        studentId={studentId}
        studentDepartment={dashboard?.student?.department || 'Computer Science'}
        studentName={dashboard?.student?.name || studentId}
      />

      {/* Floating Real-Time AI Chatbot Companion */}
      {floatingChatOpen ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '440px',
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <RealtimeChatbot
            studentId={studentId}
            isFloating={true}
            onClose={() => setFloatingChatOpen(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFloatingChatOpen(true)}
          id="floating-chat-trigger"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700',
            fontSize: '13px',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.45)',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'all 0.2s ease'
          }}
          title="Open Drift Real-Time Wellness Chatbot"
        >
          <MessageCircle size={18} />
          <span>Chat with Drift AI</span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
        </button>
      )}
    </div>
  );
}

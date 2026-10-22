import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Compass,
  Phone,
  Briefcase,
  Clock
} from 'lucide-react';
import { loginUser, registerStudent, registerCounsellor } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'counsellor' | 'admin'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student Form State
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newDepartment, setNewDepartment] = useState('Computer Science');
  const [newYear, setNewYear] = useState(3);
  const [newConsent, setNewConsent] = useState(true);

  // Counsellor Form State
  const [counsellorEmail, setCounsellorEmail] = useState('');
  const [counsellorPassword, setCounsellorPassword] = useState('');
  const [isCounsellorRegistering, setIsCounsellorRegistering] = useState(false);
  const [counsellorName, setCounsellorName] = useState('');
  const [counsellorSpecialization, setCounsellorSpecialization] = useState('Student Psychological Support');
  const [counsellorPhone, setCounsellorPhone] = useState('+1 (800) 273-TALK');

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isRegistering) {
        if (!newConsent) {
          throw new Error('Informed consent is required before creating an account.');
        }
        const regRes = await registerStudent({
          student_id: studentId.trim(),
          name: studentName.trim() || `Student ${studentId.trim()}`,
          password: studentPassword.trim(),
          department: newDepartment,
          year: Number(newYear),
          consent: newConsent,
          baseline_sleep: 7.5,
          baseline_study: 3.5
        });
        setSuccessMsg(regRes.message || 'Student registration submitted! Awaiting administrator approval.');
        setIsRegistering(false);
      } else {
        const res = await loginUser('student', studentId, studentPassword);
        onLoginSuccess(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCounsellorLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isCounsellorRegistering) {
        const regRes = await registerCounsellor({
          email: counsellorEmail.trim(),
          name: counsellorName.trim() || 'Campus Counsellor',
          password: counsellorPassword.trim(),
          specialization: counsellorSpecialization,
          phone: counsellorPhone
        });
        setSuccessMsg(regRes.message || 'Counsellor application submitted! Awaiting administrator approval.');
        setIsCounsellorRegistering(false);
      } else {
        const res = await loginUser('counsellor', counsellorEmail, counsellorPassword);
        onLoginSuccess(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Counsellor authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await loginUser('admin', adminUsername, adminPassword);
      onLoginSuccess(res);
    } catch (err) {
      setErrorMsg(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '40px auto', padding: '0 16px' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #14b8a6, #6366f1)',
            boxShadow: '0 8px 24px rgba(20, 184, 166, 0.3)',
            marginBottom: '16px',
            color: '#ffffff'
          }}
        >
          <Compass size={30} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Campus Wellness Access Portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '520px', margin: '0 auto' }}>
          Select your campus role to access personal wellness analytics, departmental aggregates, or administrative telemetry.
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '28px'
        }}
      >
        {/* Student Tab */}
        <button
          type="button"
          onClick={() => { setActiveRole('student'); setErrorMsg(''); }}
          style={{
            padding: '16px 12px',
            borderRadius: '14px',
            border: activeRole === 'student' ? '2px solid var(--teal-primary)' : '1px solid rgba(255,255,255,0.08)',
            background: activeRole === 'student' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            color: activeRole === 'student' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <GraduationCap size={24} color={activeRole === 'student' ? 'var(--teal-light)' : '#94a3b8'} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>Student</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Personal Analytics & Check-ins</div>
        </button>

        {/* Counsellor Tab */}
        <button
          type="button"
          onClick={() => { setActiveRole('counsellor'); setErrorMsg(''); }}
          style={{
            padding: '16px 12px',
            borderRadius: '14px',
            border: activeRole === 'counsellor' ? '2px solid var(--indigo-primary)' : '1px solid rgba(255,255,255,0.08)',
            background: activeRole === 'counsellor' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            color: activeRole === 'counsellor' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <Building2 size={24} color={activeRole === 'counsellor' ? '#a5b4fc' : '#94a3b8'} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>Counsellor</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Anonymized Department Trends</div>
        </button>

        {/* Admin Tab */}
        <button
          type="button"
          onClick={() => { setActiveRole('admin'); setErrorMsg(''); }}
          style={{
            padding: '16px 12px',
            borderRadius: '14px',
            border: activeRole === 'admin' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
            background: activeRole === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            color: activeRole === 'admin' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <ShieldCheck size={24} color={activeRole === 'admin' ? '#fde047' : '#94a3b8'} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>Administrator</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>System Health & Telemetry</div>
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div
          style={{
            background: errorMsg.includes('pending') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${errorMsg.includes('pending') ? 'rgba(245, 158, 11, 0.35)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: errorMsg.includes('pending') ? '#fde047' : '#fda4af',
            padding: '14px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {errorMsg.includes('pending') ? <Clock size={20} style={{ flexShrink: 0 }} /> : <AlertCircle size={18} style={{ flexShrink: 0 }} />}
            <span>{errorMsg}</span>
          </div>
          {errorMsg.includes('pending') && (
            <button
              type="button"
              onClick={() => { setActiveRole('admin'); setErrorMsg(''); }}
              style={{
                background: '#f59e0b',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Open Admin Console to Approve →
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Card Container */}
      <div className="drift-card" style={{ padding: '32px' }}>
        {/* ========================================================= */}
        {/* ROLE 1: STUDENT PORTAL                                     */}
        {/* ========================================================= */}
        {activeRole === 'student' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={22} color="var(--teal-light)" />
                  {isRegistering ? 'Register Student Profile' : 'Student Sign In'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  {isRegistering
                    ? 'Create your anonymous Student ID and initialize personal baseline tracking.'
                    : 'Enter your anonymous Student ID to access your personal wellness baseline and check-in history.'}
                </p>
              </div>
              <span className="badge badge-teal">Student Portal</span>
            </div>

            <form onSubmit={handleStudentLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Student ID
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="e.g. S042 or STU202"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {isRegistering && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Create Passcode
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input
                        type="password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 38px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Department
                      </label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#131d33',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Artificial Intelligence and Data Science">AI & Data Science</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Psychology">Psychology</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Academic Year
                      </label>
                      <select
                        value={newYear}
                        onChange={(e) => setNewYear(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#131d33',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                      >
                        <option value={1}>Year 1 (Freshman)</option>
                        <option value={2}>Year 2 (Sophomore)</option>
                        <option value={3}>Year 3 (Junior)</option>
                        <option value={4}>Year 4 (Senior)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={newConsent}
                        onChange={(e) => setNewConsent(e.target.checked)}
                        style={{ marginTop: '2px', accentColor: 'var(--teal-primary)' }}
                      />
                      <span>
                        <strong>Informed Consent:</strong> I agree to participate in confidential educational wellness tracking.
                      </span>
                    </label>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#fde047', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Admin Verification Notice:</strong> Newly registered accounts are verified by the Campus Administrator before sign-in access is activated.</span>
                  </div>
                </>
              )}

              {!isRegistering && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Student Passcode <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Default: student123)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                    <input
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                      placeholder="Enter your student passcode"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 38px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {loading ? 'Processing...' : isRegistering ? 'Submit Student Profile for Admin Approval' : 'Sign In as Student'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              {isRegistering ? (
                <span>
                  Already have an approved student profile?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--teal-light)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Back to Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Need a new student profile?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(true); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--teal-light)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Create New Student Profile (Requires Admin Approval)
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 2: COUNSELLOR PORTAL                                  */}
        {/* ========================================================= */}
        {activeRole === 'counsellor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={22} color="#a5b4fc" />
                  {isCounsellorRegistering ? 'Register as Campus Counsellor' : 'Counsellor & Faculty Access'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  {isCounsellorRegistering
                    ? 'Submit your counsellor credentials for administrator verification.'
                    : 'Sign in to monitor cohort wellness trends and receive live student consultation alerts.'}
                </p>
              </div>
              <span className="badge badge-indigo">Counsellor Portal</span>
            </div>

            <form onSubmit={handleCounsellorLogin}>
              {isCounsellorRegistering ? (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Full Name & Title
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input
                        type="text"
                        value={counsellorName}
                        onChange={(e) => setCounsellorName(e.target.value)}
                        required
                        placeholder="e.g. Dr. Emily Watson, Ph.D."
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 38px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Campus Email Address
                    </label>
                    <input
                      type="email"
                      value={counsellorEmail}
                      onChange={(e) => setCounsellorEmail(e.target.value)}
                      required
                      placeholder="emily.watson@campus.edu"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Specialization / Focus
                      </label>
                      <input
                        type="text"
                        value={counsellorSpecialization}
                        onChange={(e) => setCounsellorSpecialization(e.target.value)}
                        placeholder="e.g. Exam Anxiety, CBT"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Office Contact Phone
                      </label>
                      <input
                        type="text"
                        value={counsellorPhone}
                        onChange={(e) => setCounsellorPhone(e.target.value)}
                        placeholder="+1 (800) 273-TALK"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Account Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input
                        type="password"
                        value={counsellorPassword}
                        onChange={(e) => setCounsellorPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 38px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#fde047', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Admin Verification Notice:</strong> New counsellor accounts require administrator approval before logging in to access student consultations.</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Counsellor Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input
                        type="email"
                        value={counsellorEmail}
                        onChange={(e) => setCounsellorEmail(e.target.value)}
                        required
                        placeholder="counsellor@campus.edu"
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 38px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Access Passcode
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input
                        type="password"
                        value={counsellorPassword}
                        onChange={(e) => setCounsellorPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 38px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Processing...' : isCounsellorRegistering ? 'Submit Counsellor Application' : 'Sign In as Counsellor'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              {isCounsellorRegistering ? (
                <span>
                  Already approved counsellor?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsCounsellorRegistering(false); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Back to Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New wellness professional?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsCounsellorRegistering(true); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Apply for Counsellor Access (Requires Admin Approval)
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ROLE 3: ADMINISTRATOR PORTAL                              */}
        {/* ========================================================= */}
        {activeRole === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#fde047" />
                  System Administrator Console
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Platform telemetry, database inspectors, machine learning diagnostics, and model benchmarks.
                </p>
              </div>
              <span className="badge badge-warning">Admin Console</span>
            </div>

            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Administrator Username / Email
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="admin@campus.edu"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Security Master Passcode
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In as Administrator'}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Role Comparison Table for Quick Reference */}
      <div style={{ marginTop: '28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
          Role Capabilities & Access Boundaries:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>
            <strong style={{ color: 'var(--teal-light)' }}>🎓 Student:</strong>
            <p style={{ marginTop: '4px' }}>View personal 7-axis radar, What Changed deltas, check-in submission, and non-clinical AI suggestions.</p>
          </div>
          <div>
            <strong style={{ color: '#a5b4fc' }}>🩺 Counsellor:</strong>
            <p style={{ marginTop: '4px' }}>Inspect anonymized departmental wellness averages, elevated stress percentages, and cohort planning under $k \ge 5$.</p>
          </div>
          <div>
            <strong style={{ color: '#fde047' }}>🛡️ Administrator:</strong>
            <p style={{ marginTop: '4px' }}>Inspect total database table rows, trigger Random Forest benchmarks, view API diagnostics and system uptime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

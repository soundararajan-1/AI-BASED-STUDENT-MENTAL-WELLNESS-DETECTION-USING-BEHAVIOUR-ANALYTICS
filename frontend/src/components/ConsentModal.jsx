import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConsentModal({ isOpen, onConsentGranted }) {
  const [agreed, setAgreed] = useState(false);
  const [studentId, setStudentId] = useState('S001');
  const [dept, setDept] = useState('Computer Science');
  const [year, setYear] = useState('2');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must confirm informed consent before proceeding.');
      return;
    }
    if (!studentId.trim()) {
      setError('Please provide a Student ID.');
      return;
    }
    setError('');
    onConsentGranted({
      student_id: studentId.trim(),
      department: dept,
      year: parseInt(year, 10),
      consent: true
    });
  };

  return (
    <div className="modal-overlay" id="consent-modal">
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            background: 'rgba(20, 184, 166, 0.15)',
            padding: '12px',
            borderRadius: '12px',
            color: '#2dd4bf'
          }}>
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Informed Wellness Consent</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Privacy-first student wellness system</p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '13px',
          color: '#cbd5e1',
          marginBottom: '20px',
          lineHeight: '1.6'
        }}>
          <p style={{ marginBottom: '10px' }}>
            <strong>Important Notice:</strong> Drift is an <em>educational wellness-support prototype</em> designed to notice shifts in personal habits. It is <strong>NOT a medical diagnostic tool</strong>.
          </p>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>No personal names, email addresses, or phone numbers are ever collected.</li>
            <li>Metrics are stored locally in an encrypted database using your Student ID only.</li>
            <li>Counsellor reporting is strictly aggregated (minimum 5 students per cohort).</li>
            <li>You can permanently delete all your data at any time via the profile menu.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Student ID
              </label>
              <input
                id="student-id-input"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. S001"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Department
              </label>
              <select
                id="dept-select"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                style={{
                  width: '100%',
                  background: '#131d33',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '14px'
                }}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Psychology">Psychology</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Biology">Biology</option>
                <option value="Literature & Arts">Literature & Arts</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px',
            background: agreed ? 'rgba(20, 184, 166, 0.08)' : 'transparent',
            borderRadius: '10px',
            border: agreed ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid transparent'
          }}>
            <input
              id="consent-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer', width: '18px', height: '18px', accentColor: '#14b8a6' }}
            />
            <label htmlFor="consent-checkbox" style={{ fontSize: '13px', color: '#f1f5f9', cursor: 'pointer' }}>
              I understand that Drift is a non-clinical wellness support prototype, and I consent to logging my daily habits to learn my personal normal band.
            </label>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontSize: '13px', marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              id="consent-submit-btn"
              type="submit"
              className="btn-primary"
              style={{ width: '100%' }}
            >
              <CheckCircle size={18} />
              Confirm & Enter Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

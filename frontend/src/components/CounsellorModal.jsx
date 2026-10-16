import React, { useEffect, useState } from 'react';
import { Users, X, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import { fetchCounsellorSummary } from '../api';

export default function CounsellorModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCounsellorSummary()
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" id="counsellor-modal">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '10px',
              borderRadius: '10px',
              color: '#a5b4fc'
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Counsellor Aggregate Overview</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Campus Departmental Wellness Planning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{
          background: 'rgba(20, 184, 166, 0.08)',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={20} color="#2dd4bf" />
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            <strong>Privacy Guard:</strong> Strict <em>k-anonymity (k &ge; 5)</em> is enforced. Only departments with 5 or more students are reported. Individual student IDs and personal notes are never accessible.
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Loading aggregate metrics...</p>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Consented Cohort</span>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#2dd4bf' }}>{data?.total_students || 0}</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Active Departments</span>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#818cf8' }}>{data?.active_departments_tracked || 0}</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Anonymity Threshold</span>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>k &ge; 5</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Department</th>
                    <th style={{ padding: '10px 8px' }}>Students</th>
                    <th style={{ padding: '10px 8px' }}>Avg Stress</th>
                    <th style={{ padding: '10px 8px' }}>Avg Mood</th>
                    <th style={{ padding: '10px 8px' }}>Elevated Load</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.departments?.map((dept) => (
                    <tr key={dept.department} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#f1f5f9' }}>{dept.department}</td>
                      <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>{dept.student_count}</td>
                      <td style={{ padding: '10px 8px', color: dept.avg_stress >= 3.5 ? '#f43f5e' : '#2dd4bf' }}>
                        {dept.avg_stress} / 5
                      </td>
                      <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>{dept.avg_mood} / 5</td>
                      <td style={{ padding: '10px 8px', color: dept.elevated_stress_pct > 30 ? '#f59e0b' : '#94a3b8' }}>
                        {dept.elevated_stress_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

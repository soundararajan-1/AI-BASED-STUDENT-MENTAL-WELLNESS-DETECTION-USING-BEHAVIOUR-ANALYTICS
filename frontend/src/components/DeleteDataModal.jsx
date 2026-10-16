import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { deleteStudentData } from '../api';

export default function DeleteDataModal({ isOpen, onClose, studentId, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudentData(studentId);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to delete data');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" id="delete-data-modal">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e' }}>
            <Trash2 size={22} />
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Delete My Data</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#fda4af',
          lineHeight: '1.5'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '6px' }}>Permanently remove all records?</p>
          <p>
            This action will purge your profile, daily check-in logs, calculated personal bands,
            and drift indicators for Student ID <strong>{studentId}</strong>. This cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: '#f43f5e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

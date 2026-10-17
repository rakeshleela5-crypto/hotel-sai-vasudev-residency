import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface CancelKotModalProps {
  isOpen: boolean;
  onClose: () => void;
  kotNo: string;
  onCancelSuccess: () => void;
}

export const CancelKotModal: React.FC<CancelKotModalProps> = ({
  isOpen,
  onClose,
  kotNo,
  onCancelSuccess
}) => {
  const [reason, setReason] = useState('NOT REQ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmCancel = () => {
    if (!reason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    setIsSubmitting(true);
    const res = PmsStore.cancelKot(kotNo, reason.trim());
    setIsSubmitting(false);
    if (res.success) {
      alert(res.message);
      onCancelSuccess();
      onClose();
    } else {
      alert(res.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 8,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Frame 290 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            Cancel Record
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              width: 28,
              height: 28,
              fontSize: 16,
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              marginBottom: 8
            }}
          >
            Reason for cancellation:
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. NOT REQ / Guest Cancelled"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid #0284c7',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
            Target KOT: <span style={{ fontWeight: 700, color: '#0f172a' }}>{kotNo}</span>
          </div>
        </div>

        {/* Footer Actions - Matching Frame 290 */}
        <div
          style={{
            padding: '14px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12
          }}
        >
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmCancel}
            style={{
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {isSubmitting ? 'Cancelling...' : 'Cancel Record'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#475569',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

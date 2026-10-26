import React, { useState } from 'react';
import './pmsStyles.css';

interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actionType?: 'void_kot' | 'discount_override' | 'rate_override';
  actionDescription?: string;
  itemDescription?: string;
  requestedValue?: string | number;
  onAuthorized: (pin: string, reason: string) => void;
}

const VOID_REASONS = [
  'Wrong item punched by steward',
  'Guest changed mind / cancelled order',
  'Kitchen out of stock / ingredient unavailable',
  'Food preparation quality issue / burnt',
  'Table shifted / duplicate KOT entry',
  'Guest left table before service'
];

const DISCOUNT_REASONS = [
  'Corporate tie-up contract (JK Paper / Corporate Guest)',
  'Management courtesy / MD approved concession',
  'Guest service recovery / inconvenience compensation',
  'Long-stay pilgrim concession',
  'Banquet / bulk party negotiated discount'
];

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  onClose,
  title,
  actionType = 'void_kot',
  actionDescription,
  itemDescription,
  requestedValue,
  onAuthorized
}) => {
  const [pin, setPin] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>(
    actionType === 'void_kot' ? VOID_REASONS[0] : DISCOUNT_REASONS[0]
  );
  const [customNotes, setCustomNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayDesc = actionDescription || itemDescription;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedPin = pin.trim();
    // Valid manager pins: 9999 (default master PIN), 1234, 8888
    if (!trimmedPin || (trimmedPin !== '9999' && trimmedPin !== '1234' && trimmedPin !== '8888')) {
      setErrorMessage('❌ Invalid Manager PIN! Authorization rejected. (Default Master PIN: 9999)');
      return;
    }

    const fullReason = customNotes.trim()
      ? `${selectedReason} - ${customNotes.trim()}`
      : selectedReason;

    onAuthorized(trimmedPin, fullReason);
    setPin('');
    setCustomNotes('');
    onClose();
  };

  const isVoid = actionType === 'void_kot';

  return (
    <div className="pms-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="pms-window"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '2px solid #b91c1c'
        }}
      >
        {/* Header */}
        <header
          style={{
            background: '#991b1b',
            color: '#ffffff',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <strong style={{ fontSize: 14, letterSpacing: 0.5 }}>
              {title || (isVoid ? 'SECURITY LOCK: MANAGER VOID OVERRIDE' : 'SECURITY LOCK: DISCOUNT CAP OVERRIDE')}
            </strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 18,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </header>

        {/* Warning Badge */}
        <div
          style={{
            background: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            padding: '10px 16px',
            fontSize: 12,
            color: '#991b1b',
            lineHeight: 1.4
          }}
        >
          <strong>⚠️ Anti-Fraud Enforcement:</strong>{' '}
          {isVoid
            ? 'Once punched, KOT items cannot be deleted or reduced freely. A verified Manager PIN and audit reason are mandatory.'
            : 'Front Desk & POS Cashiers are capped at 5% max discount. Any higher deduction requires explicit Manager PIN override.'}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 18 }}>
          {displayDesc && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 14,
                fontSize: 12.5,
                color: '#334155'
              }}
            >
              <div>
                <strong>Target Item / Bill:</strong> {displayDesc}
              </div>
              {requestedValue && (
                <div style={{ marginTop: 2, color: '#b91c1c', fontWeight: 700 }}>
                  {isVoid ? `Void Amount: ${requestedValue}` : `Requested Discount: ${requestedValue}`}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #f87171',
                color: '#b91c1c',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 14
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Manager PIN */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Enter 4-Digit Manager PIN <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN (e.g. 9999)"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 18,
                letterSpacing: 4,
                textAlign: 'center',
                fontWeight: 800,
                borderRadius: 6,
                border: '2px solid #cbd5e1',
                boxSizing: 'border-box'
              }}
              required
            />
            <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 3 }}>
              Default Master PIN: <strong>9999</strong> (Logged in immutable audit logs)
            </small>
          </div>

          {/* Mandatory Reason Dropdown */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Mandatory Audit Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12.5,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
              required
            >
              {(isVoid ? VOID_REASONS : DISCOUNT_REASONS).map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other / Special Executive Exception">Other / Special Executive Exception</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Additional Audit Notes / Guest Explanation (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Provide exact details for statutory auditor & owner review..."
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f1f5f9',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#b91c1c',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🔓 Authorize &amp; Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

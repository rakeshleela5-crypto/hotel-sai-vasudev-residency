import React, { useState, useEffect } from 'react';
import { pinService } from '../../services/pinService';

export interface ManagerPinModalProps {
  isOpen: boolean;
  title?: string;
  actionTitle?: string;
  actionDescription?: string;
  onClose?: () => void;
  onCancel?: () => void;
  onSuccess?: (token: string) => void;
  onAuthorized?: (pin: string, reason: string) => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  title,
  actionTitle = 'Supervisor Authorization Required',
  actionDescription = 'Enter the 4-6 digit Manager PIN to authorize this sensitive action.',
  onClose,
  onCancel,
  onSuccess,
  onAuthorized
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  const displayTitle = title || actionTitle;
  const handleDismiss = onCancel || onClose || (() => {});

  // Sync lockout state
  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setReason('');
      setError(null);
      return;
    }

    const remaining = pinService.getLockoutRemainingSeconds();
    setLockoutSec(remaining);

    if (remaining > 0) {
      const timer = setInterval(() => {
        setLockoutSec(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (lockoutSec > 0 || isSubmitting) return;
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (lockoutSec > 0 || isSubmitting) return;
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    if (lockoutSec > 0 || isSubmitting) return;
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (lockoutSec > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await pinService.verifyPin(pin, displayTitle);
    setIsSubmitting(false);

    if (result.success && result.token) {
      const verifiedPin = pin;
      const customReason = reason.trim() || 'Manager Authorization Approved';
      setPin('');
      setReason('');
      if (onSuccess) onSuccess(result.token);
      if (onAuthorized) onAuthorized(verifiedPin, customReason);
      if (!onSuccess && !onAuthorized) handleDismiss();
    } else {
      setError(result.message || 'Incorrect PIN.');
      setPin('');
      const rem = pinService.getLockoutRemainingSeconds();
      if (rem > 0) {
        setLockoutSec(rem);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 16
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px #475569',
          width: '100%',
          maxWidth: 380,
          padding: 24,
          position: 'relative',
          userSelect: 'none'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#1e293b',
              color: '#f59e0b',
              border: '1px solid #d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto 12px'
            }}
          >
            🔒
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            {displayTitle}
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0' }}>
            {actionDescription}
          </p>
        </div>

        {/* Lockout Warning */}
        {lockoutSec > 0 ? (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #dc2626',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#fecaca',
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 16
            }}
          >
            ⚠️ Gate temporarily locked: Try again in <strong>{lockoutSec}s</strong>
          </div>
        ) : null}

        {/* Optional Authorization Reason Input */}
        {onAuthorized && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
              Mandatory Reason / Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Guest complaint / AC repair / Director discount"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* PIN Dots Display */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            padding: '14px',
            backgroundColor: '#1e293b',
            borderRadius: 12,
            border: '1px solid #334155',
            minHeight: 52
          }}
        >
          {[0, 1, 2, 3, 4, 5].map(idx => {
            const hasDigit = idx < pin.length;
            return (
              <div
                key={idx}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: hasDigit ? '#f59e0b' : '#334155',
                  boxShadow: hasDigit ? '0 0 8px rgba(245, 158, 11, 0.6)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && lockoutSec === 0 && (
          <div
            style={{
              color: '#ef4444',
              fontSize: 12,
              textAlign: 'center',
              marginBottom: 14,
              fontWeight: 600
            }}
          >
            {error}
          </div>
        )}

        {/* Numpad Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 16
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={lockoutSec > 0 || isSubmitting}
              onClick={() => handleDigit(num)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: 10,
                fontSize: 20,
                fontWeight: 600,
                height: 52,
                cursor: lockoutSec > 0 || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: lockoutSec > 0 ? 0.5 : 1,
                transition: 'all 0.1s'
              }}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSec > 0 || isSubmitting}
            onClick={handleClear}
            style={{
              backgroundColor: '#334155',
              color: '#94a3b8',
              border: '1px solid #475569',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              height: 52,
              cursor: lockoutSec > 0 ? 'not-allowed' : 'pointer',
              opacity: lockoutSec > 0 ? 0.5 : 1
            }}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={lockoutSec > 0 || isSubmitting}
            onClick={() => handleDigit('0')}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 10,
              fontSize: 20,
              fontWeight: 600,
              height: 52,
              cursor: lockoutSec > 0 || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: lockoutSec > 0 ? 0.5 : 1
            }}
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSec > 0 || isSubmitting}
            onClick={handleBackspace}
            style={{
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              height: 52,
              cursor: lockoutSec > 0 ? 'not-allowed' : 'pointer',
              opacity: lockoutSec > 0 ? 0.5 : 1
            }}
          >
            ⌫
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid #475569',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pin.length < 4 || lockoutSec > 0 || isSubmitting}
            onClick={() => handleSubmit()}
            style={{
              flex: 2,
              backgroundColor: pin.length >= 4 && lockoutSec === 0 ? '#d97706' : '#78350f',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 700,
              cursor: pin.length >= 4 && lockoutSec === 0 && !isSubmitting ? 'pointer' : 'not-allowed',
              opacity: pin.length >= 4 && lockoutSec === 0 && !isSubmitting ? 1 : 0.6,
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Authorize Action'}
          </button>
        </div>
      </div>
    </div>
  );
};

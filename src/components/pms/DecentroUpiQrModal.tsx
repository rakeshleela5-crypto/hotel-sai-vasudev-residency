import React, { useState, useEffect, useRef } from 'react';
import { decentroApi, type DecentroUpiQrResponse, type DecentroPaymentSuccessEvent } from '../../services/decentroApi';

interface DecentroUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  purpose: string;
  roomNo?: string;
  bookingId?: number;
  kotId?: string;
  onPaymentSuccess?: (txn: {
    reference_id: string;
    bank_reference_number: string;
    amount: number;
    payer_vpa?: string;
  }) => void;
  onSwitchToManualPos?: () => void;
}

export const DecentroUpiQrModal: React.FC<DecentroUpiQrModalProps> = ({
  isOpen,
  onClose,
  amount,
  purpose,
  roomNo,
  bookingId,
  kotId,
  onPaymentSuccess,
  onSwitchToManualPos
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [qrData, setQrData] = useState<DecentroUpiQrResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCircuitTripped, setIsCircuitTripped] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes in seconds
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [paymentSuccess, setPaymentSuccess] = useState<DecentroPaymentSuccessEvent | null>(null);
  const thermalPrintRef = useRef<HTMLDivElement>(null);

  // 1. Generate Dynamic QR when modal opens
  useEffect(() => {
    if (!isOpen || amount <= 0) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setPaymentSuccess(null);
    setTimeLeft(900);

    decentroApi.generateUpiQr({
      amount,
      room_no: roomNo,
      booking_id: bookingId,
      kot_id: kotId,
      purpose_message: purpose,
      expiry_minutes: 15
    })
      .then(res => {
        if (isMounted) {
          setQrData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to initialize Decentro UPI QR');
          setLoading(false);
          if (err.decentro_unavailable || String(err.message).toLowerCase().includes('circuit')) {
            setIsCircuitTripped(true);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, roomNo, bookingId, kotId, purpose]);

  // 2. Countdown Timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0 || paymentSuccess) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, paymentSuccess]);

  // 3. Real-Time WebSocket Listener
  useEffect(() => {
    if (!isOpen || !qrData || paymentSuccess) return;

    const currentRef = qrData.reference_id;

    const unsubscribe = decentroApi.connectPaymentWebSocket(
      (event) => {
        // Reconcile if reference matches or if room/kot matches
        const matchesRef = event.reference_id === currentRef;
        const matchesRoom = roomNo && event.room_no === roomNo;
        const matchesKot = kotId && event.kot_id === kotId;

        if (matchesRef || matchesRoom || matchesKot) {
          console.log('[Decentro Modal] Real-time payment match confirmed:', event);
          decentroApi.playSuccessChime();
          setPaymentSuccess(event);

          if (onPaymentSuccess) {
            onPaymentSuccess({
              reference_id: event.reference_id,
              bank_reference_number: event.bank_reference_number,
              amount: event.amount,
              payer_vpa: event.payer_vpa
            });
          }
        }
      },
      (status) => setWsStatus(status)
    );

    return () => unsubscribe();
  }, [isOpen, qrData, paymentSuccess, roomNo, kotId, onPaymentSuccess]);

  if (!isOpen) return null;

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerPercent = (timeLeft / 900) * 100;

  // Handle Thermal Print
  const handlePrintThermal = () => {
    if (!thermalPrintRef.current) return;
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      alert('Please allow popups to print thermal QR receipt.');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>UPI QR Thermal Slip - Hotel Sai Vasudev Residency</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', monospace;
              width: 76mm;
              margin: 0 auto;
              padding: 8px 4px;
              color: #000;
              text-align: center;
              font-size: 11px;
            }
            .title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }
            .subtitle { font-size: 10px; font-weight: 600; margin-bottom: 6px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .qr-img { width: 190px; height: 190px; margin: 6px auto; display: block; }
            .amount-box { font-size: 18px; font-weight: 900; margin: 6px 0; }
            .meta-row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; }
            .footer { font-size: 9px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="title">HOTEL SAI VASUDEV RESIDENCY</div>
          <div class="subtitle">Near Andhra Bank, New Colony, Rayagada, Odisha - 765001</div>
          <div class="subtitle">GSTIN: 21AEKPP8689J1ZS</div>
          <div class="divider"></div>
          <div class="amount-box">₹${amount.toFixed(2)}</div>
          <div style="font-weight: 800; font-size: 11px;">SCAN &amp; PAY VIA ANY UPI APP</div>
          <img src="${qrData?.qr_code_base64}" class="qr-img" alt="Decentro UPI QR" />
          <div style="font-size: 9px; font-weight: 700;">GPay &bull; PhonePe &bull; Paytm &bull; BHIM &bull; Cred</div>
          <div class="divider"></div>
          <div class="meta-row"><span>Ref ID:</span><span>${qrData?.reference_id || 'N/A'}</span></div>
          ${roomNo ? `<div class="meta-row"><span>Room No:</span><span>${roomNo}</span></div>` : ''}
          ${kotId ? `<div class="meta-row"><span>KOT / Bill:</span><span>${kotId}</span></div>` : ''}
          <div class="meta-row"><span>Purpose:</span><span>${purpose}</span></div>
          <div class="meta-row"><span>Generated:</span><span>${new Date().toLocaleTimeString()}</span></div>
          <div class="divider"></div>
          <div class="footer">
            <div>* Real-Time Bank Settlement via Decentro *</div>
            <div style="margin-top: 4px; font-weight: 800;">🙏 Divine Hospitality &bull; Om Sai Ram 🙏</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.1)',
          maxWidth: 480,
          width: '100%',
          overflow: 'hidden',
          animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 18,
                color: '#fff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              ⚡
            </div>
            <div>
              <div id="decentro-modal-title" style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.02em', color: '#f8fafc' }}>
                Dynamic Decentro UPI QR
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>SRI SAI VASUDEV RESIDENCY</span>
                <span>&bull;</span>
                <span style={{ color: '#38bdf8' }}>GSTIN: 21AEKPP8689J1ZS</span>
              </div>
            </div>
          </div>

          <button
            id="close-decentro-qr-btn"
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: '4px solid #e2e8f0',
                  borderTopColor: '#0284c7',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Generating Dynamic Decentro QR...</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Calling Decentro Banking API for instant settlement
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>{error}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                {isCircuitTripped
                  ? 'Decentro Banking Gateway circuit breaker is currently OPEN.'
                  : 'Please check backend connectivity or use manual cash/card settlement.'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {onSwitchToManualPos && (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToManualPos();
                      onClose();
                    }}
                    style={{
                      background: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 6,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: 12,
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    ⚡ Switch to Manual POS Form
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : paymentSuccess ? (
            /* Payment Reconciled Success Screen */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  border: '4px solid #86efac',
                  color: '#15803d',
                  fontSize: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)'
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#166534' }}>
                Payment Successfully Received!
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                Auto-reconciled via Decentro Webhook into PMS Folio
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 16px',
                  margin: '18px 0',
                  textAlign: 'left',
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Amount Credited:</span>
                  <span style={{ fontWeight: 900, color: '#15803d', fontSize: 14 }}>
                    ₹{paymentSuccess.amount.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Bank Reference (UTR):</span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {paymentSuccess.bank_reference_number}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Decentro Ref:</span>
                  <span style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                    {paymentSuccess.reference_id}
                  </span>
                </div>
                {paymentSuccess.payer_vpa && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payer UPI:</span>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{paymentSuccess.payer_vpa}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.3)'
                  }}
                >
                  Close &amp; Complete Checkout
                </button>
              </div>
            </div>
          ) : (
            /* Active Dynamic QR & Live WebSocket Screen */
            <div>
              {/* Amount Display */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Settlement Amount
                  </div>
                  <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{purpose}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>₹{amount.toFixed(2)}</div>
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid #0284c7',
                  borderRadius: 14,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.15)',
                  position: 'relative'
                }}
              >
                {qrData?.qr_code_base64 && (
                  <img
                    src={qrData.qr_code_base64}
                    alt="Decentro Dynamic UPI QR"
                    style={{
                      width: 230,
                      height: 230,
                      objectFit: 'contain',
                      borderRadius: 8
                    }}
                  />
                )}

                {/* Scan Instructions Pill */}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#0369a1',
                    background: '#e0f2fe',
                    padding: '3px 12px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>📷 Scan with GPay, PhonePe, Paytm, BHIM</span>
                </div>
              </div>

              {/* Timer & WebSocket Pulse Bar */}
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    marginBottom: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: wsStatus === 'connected' ? '#16a34a' : '#f59e0b',
                        boxShadow:
                          wsStatus === 'connected'
                            ? '0 0 8px #22c55e'
                            : '0 0 6px #f59e0b'
                      }}
                    />
                    <span style={{ fontWeight: 700, color: '#334155' }}>
                      {wsStatus === 'connected' ? 'WebSocket Live & Listening' : 'Connecting WebSocket...'}
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, color: timeLeft < 120 ? '#dc2626' : '#0f172a' }}>
                    ⏳ Expires in: {timeFormatted}
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: 5,
                    background: '#e2e8f0',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${timerPercent}%`,
                      height: '100%',
                      background: timeLeft < 120 ? '#dc2626' : '#0284c7',
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
              </div>

              {/* Reference ID & Intent link for touch devices */}
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  color: '#64748b'
                }}
              >
                <span>Ref: <strong style={{ color: '#0f172a' }}>{qrData?.reference_id}</strong></span>
                {qrData?.upi_intent_link && (
                  <a
                    href={qrData.upi_intent_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#0284c7',
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: 11
                    }}
                  >
                    Open in UPI App ↗
                  </a>
                )}
              </div>

              {/* Action Buttons: Print Thermal QR & Manual Re-check */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: 10,
                  marginTop: 16
                }}
              >
                <button
                  type="button"
                  onClick={handlePrintThermal}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <span>🖨️ Print QR on Thermal Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!qrData?.reference_id) return;
                    try {
                      const res = await decentroApi.getTransactionStatus(qrData.reference_id);
                      if (res.status === 'SUCCESS') {
                        decentroApi.playSuccessChime();
                        setPaymentSuccess({
                          event: 'PAYMENT_SUCCESS',
                          reference_id: res.reference_id,
                          amount: res.amount,
                          bank_reference_number: res.bank_reference_number || 'MANUAL-CONFIRM',
                          payer_vpa: res.payer_vpa || 'guest@upi',
                          timestamp: new Date().toISOString()
                        });
                        if (onPaymentSuccess) {
                          onPaymentSuccess({
                            reference_id: res.reference_id,
                            bank_reference_number: res.bank_reference_number || 'MANUAL-CONFIRM',
                            amount: res.amount,
                            payer_vpa: res.payer_vpa || 'guest@upi'
                          });
                        }
                      } else {
                        alert(`Decentro Status: ${res.status}. Payment has not been credited yet.`);
                      }
                    } catch (e: any) {
                      alert('Status check note: Payment pending confirmation from bank.');
                    }
                  }}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔄 Check Status
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden thermal print helper */}
        <div ref={thermalPrintRef} style={{ display: 'none' }} />
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

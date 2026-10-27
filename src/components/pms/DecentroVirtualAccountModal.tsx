import React, { useState } from 'react';
import { decentroApi, type DecentroVirtualAccountResponse } from '../../services/decentroApi';
import { hotelApi } from '../../services/api';

interface DecentroVirtualAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: number;
  groupId?: string;
  defaultCorporateName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  onAccountCreated?: (va: DecentroVirtualAccountResponse) => void;
}

export const DecentroVirtualAccountModal: React.FC<DecentroVirtualAccountModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  groupId,
  defaultCorporateName = '',
  defaultEmail = '',
  defaultPhone = '',
  onAccountCreated
}) => {
  const [corporateName, setCorporateName] = useState(defaultCorporateName || 'JK Paper Ltd');
  const [contactEmail, setContactEmail] = useState(defaultEmail || 'accounts@jkpaper.com');
  const [contactPhone, setContactPhone] = useState(defaultPhone || '9437012345');
  const [address, setAddress] = useState('Rayagada, Odisha - 765001');
  const [corporateClientId, setCorporateClientId] = useState('JK-CORP');

  const [loading, setLoading] = useState(false);
  const [createdVa, setCreatedVa] = useState<DecentroVirtualAccountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await decentroApi.createVirtualAccount({
        corporate_name: corporateName,
        corporate_client_id: corporateClientId,
        booking_id: bookingId,
        group_id: groupId,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address
      });
      setCreatedVa(res);

      // Persist virtual account to PostgreSQL backend
      await hotelApi.createVirtualAccount({
        account_number: res.account_number,
        ifsc: res.ifsc_code,
        upi_id: res.upi_id || `${res.account_number}@yesbank`,
        booking_id: bookingId,
        guest_name: corporateName,
        status: 'Active'
      }).catch(console.warn);

      if (onAccountCreated) {
        onAccountCreated(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create virtual account');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: 520,
          width: '100%',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>🏢 Decentro Corporate Virtual Account</div>
            <div style={{ fontSize: 11, color: '#c7d2fe' }}>Dedicated NEFT / RTGS / IMPS Account for B2B Group Bookings</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {createdVa ? (
            <div>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>
                  ✓ Dedicated Virtual Account Active
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                  Tied to: <strong>{createdVa.account_name}</strong>
                </div>
              </div>

              {/* Account Details Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Virtual Account Number:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 900, fontSize: 15, fontFamily: 'monospace', color: '#0f172a' }}>
                      {createdVa.account_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdVa.account_number, 'acc')}
                      style={{
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 700,
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedField === 'acc' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>IFSC Code:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                      {createdVa.ifsc_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdVa.ifsc_code, 'ifsc')}
                      style={{
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 700,
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedField === 'ifsc' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Bank &amp; Branch:</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>
                    {createdVa.bank_name} &bull; CMS Branch
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Virtual UPI ID:</span>
                  <span style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                    {createdVa.upi_id || `${createdVa.account_number.toLowerCase()}@yesbank`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Decentro URN:</span>
                  <span style={{ fontWeight: 600, color: '#64748b', fontSize: 10 }}>
                    {createdVa.decentro_urn || 'DCN-URN-RECONCILED'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                💡 Direct bank transfers (NEFT/RTGS/IMPS) to this account will automatically trigger real-time Decentro webhooks and credit this folio.
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#1e1b4b',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Corporate Client / Group Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={corporateName}
                    onChange={e => setCorporateName(e.target.value)}
                    placeholder="e.g. JK Paper Ltd / Tata Consultancy"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Corporate Client Code
                    </label>
                    <input
                      type="text"
                      value={corporateClientId}
                      onChange={e => setCorporateClientId(e.target.value)}
                      placeholder="e.g. JK-CORP"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                      Contact Mobile
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="9437012345"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Finance / Accounts Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="accounts@corporate.com"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Rayagada, Odisha - 765001"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 6,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Creating with Decentro...' : 'Generate Dedicated Virtual Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

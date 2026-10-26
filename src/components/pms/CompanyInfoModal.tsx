import React, { useState, useEffect } from 'react';
import type { PmsCompanyInfo } from '../../types/pmsModels';
import { PmsStore, DEFAULT_COMPANY_INFO } from '../../services/pmsStore';
import './pmsStyles.css';

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (info: PmsCompanyInfo) => void;
}

export const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [formData, setFormData] = useState<PmsCompanyInfo>({ ...DEFAULT_COMPANY_INFO });
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = PmsStore.getCompanyInfo();
      setFormData(current);
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof PmsCompanyInfo, val: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      // If GST No is changed, automatically update companyGstCode (first 2 digits) & pencardNo (chars 2..12)
      if (field === 'gstNo' && typeof val === 'string' && val.length >= 2) {
        next.companyGstCode = val.slice(0, 2);
        if (val.length >= 12) {
          next.pencardNo = val.slice(2, 12);
        }
      }
      return next;
    });
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PmsCompanyInfo = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    PmsStore.saveCompanyInfo(updated);
    setSuccessBanner(
      `Company Info Applied! Local GST Policy: ${
        updated.makeAllBillLocalGst ? 'ENABLED (All Bills Forced to Local SGST + CGST)' : 'DISABLED (Interstate IGST Allowed)'
      }`
    );
    if (onSaved) {
      onSaved(updated);
    }
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div 
        className="pms-window" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 960, maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header matching Video 10 Frame 0100 & 0320 */}
        <header className="pms-header" style={{ background: '#212529', color: '#fff' }}>
          <div className="pms-header-left">
            <span style={{ fontSize: 16 }}>🏢</span>
            <h2 className="pms-brand-title" style={{ fontSize: 14 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; COMPANY / FIRM / BUSINESS DETAILS (/company_info_form)
            </h2>
          </div>
          <div className="pms-header-right">
            <button
              type="button"
              onClick={onClose}
              className="pms-close-btn"
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Success Alert */}
        {successBanner && (
          <div style={{
            background: '#d1e7dd',
            color: '#0f5132',
            border: '1px solid #badbcc',
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>✓ {successBanner}</span>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Body */}
        <form onSubmit={handleApply} style={{ padding: 20 }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#1e293b',
            textAlign: 'center',
            marginBottom: 20,
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 10
          }}>
            Company / Firm / Business Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Firm Name */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Trade / Firm Name</label>
              <input
                type="text"
                value={formData.firmName}
                onChange={e => handleChange('firmName', e.target.value)}
                className="form-input-pms"
                required
              />
            </div>

            {/* Legal / Proprietor Name */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Legal / Proprietor Name (As per GST Certificate)</label>
              <input
                type="text"
                value={formData.legalName || ''}
                onChange={e => handleChange('legalName', e.target.value)}
                className="form-input-pms"
                placeholder="e.g. PAIDISETTY MANMADHA RAO"
              />
            </div>

            {/* Address 1 */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Address 1</label>
              <input
                type="text"
                value={formData.address1}
                onChange={e => handleChange('address1', e.target.value)}
                className="form-input-pms"
                required
              />
            </div>

            {/* Address 2 */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Address 2</label>
              <input
                type="text"
                value={formData.address2 || ''}
                onChange={e => handleChange('address2', e.target.value)}
                className="form-input-pms"
              />
            </div>

            {/* City & Pincode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div className="form-group-pms" style={{ margin: 0 }}>
                <label className="form-label-pms">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="form-input-pms"
                  required
                />
              </div>
              <div className="form-group-pms" style={{ margin: 0 }}>
                <label className="form-label-pms">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  className="form-input-pms"
                  required
                />
              </div>
            </div>

            {/* State & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div className="form-group-pms" style={{ margin: 0 }}>
                <label className="form-label-pms">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => handleChange('state', e.target.value)}
                  className="form-input-pms"
                  required
                />
              </div>
              <div className="form-group-pms" style={{ margin: 0 }}>
                <label className="form-label-pms">Phone</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="form-input-pms"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Mobile</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={e => handleChange('mobile', e.target.value)}
                className="form-input-pms"
                required
              />
            </div>

            {/* Email */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="form-input-pms"
                required
              />
            </div>

            {/* Website */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Website</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={e => handleChange('website', e.target.value)}
                className="form-input-pms"
              />
            </div>

            {/* GST No */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">GST No</label>
              <input
                type="text"
                value={formData.gstNo}
                onChange={e => handleChange('gstNo', e.target.value.toUpperCase())}
                className="form-input-pms"
                style={{ fontWeight: 800, letterSpacing: '0.05em' }}
                required
              />
            </div>

            {/* Company GST CODE & Pencard No */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
              <div className="form-group-pms" style={{ margin: 0 }}>
                <label className="form-label-pms">Company GST CODE (State Code)</label>
                <input
                  type="text"
                  value={formData.companyGstCode}
                  onChange={e => handleChange('companyGstCode', e.target.value)}
                  className="form-input-pms"
                  placeholder="e.g. 27"
                  style={{ fontWeight: 800 }}
                  required
                />
              </div>
              <div className="form-group-pms" style={{ margin: 0 }}>
                <label className="form-label-pms">Pencard No</label>
                <input
                  type="text"
                  value={formData.pencardNo || ''}
                  onChange={e => handleChange('pencardNo', e.target.value.toUpperCase())}
                  className="form-input-pms"
                  placeholder="e.g. ABCDE1234F"
                />
              </div>
            </div>

            {/* Reg No 2 */}
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Reg No 2</label>
              <input
                type="text"
                value={formData.regNo2 || ''}
                onChange={e => handleChange('regNo2', e.target.value)}
                className="form-input-pms"
              />
            </div>
          </div>

          {/* Video 10 Core Toggles: GST Not Applicable & Make All Bill Local GST */}
          <div style={{
            background: '#f8fafc',
            border: '2px solid #38bdf8',
            borderRadius: 6,
            padding: '14px 18px',
            marginTop: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.gstNotApplicable}
                onChange={e => handleChange('gstNotApplicable', e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span>GST Not Applicable (Disable all GST on hotel accommodation &amp; restaurant bills)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0369a1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.makeAllBillLocalGst}
                onChange={e => handleChange('makeAllBillLocalGst', e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span>Make All Bill Local GST (SGST + CGST for All Bills)</span>
            </label>

            <div style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '8px 12px', borderRadius: 4, marginTop: 4 }}>
              💡 <strong>Tax Rule Explanation:</strong> When <em>Make All Bill Local GST</em> is checked, all guest invoices apply <strong>SGST (6%) + CGST (6%)</strong> even if the guest has an out-of-state GSTIN (e.g. MP State 23, UP State 09, Gujarat State 24). When unchecked, out-of-state guests receive an <strong>Interstate IGST (12%)</strong> tax invoice .
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="submit"
              className="pms-btn pms-btn-primary"
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 14,
                fontWeight: 800,
                background: '#2563eb'
              }}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pms-btn"
              style={{
                width: 140,
                background: '#1e293b',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              Dash Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

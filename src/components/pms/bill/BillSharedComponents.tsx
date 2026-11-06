import React from 'react';
import type { PmsCompanyInfo } from '../../../types/pmsModels';

export interface BillBankAndQrProps {
  companyInfo: PmsCompanyInfo;
  upiQrUrl: string;
}

export const BillBankDetailsAndQr: React.FC<BillBankAndQrProps> = ({ companyInfo, upiQrUrl }) => {
  return (
    <div style={{ border: '1px solid #000', marginTop: 10, fontSize: 10 }}>
      <div
        style={{
          background: '#e0edff',
          padding: '4px 8px',
          fontWeight: 800,
          textAlign: 'center',
          borderBottom: '1px solid #000'
        }}
      >
        Terms &amp; Conditions
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.4fr', minHeight: 90 }}>
        {/* Bank Info */}
        <div style={{ padding: '6px 8px', borderRight: '1px solid #000', lineHeight: 1.4 }}>
          <div><strong>Bank Name:</strong> {companyInfo.bankName || 'STATE BANK OF INDIA'}</div>
          <div><strong>Bank A/C No:</strong> {companyInfo.bankAccountNo || '923020035404769'}</div>
          <div><strong>Bank IFSC:</strong> {companyInfo.bankIfsc || 'SBIN000390'}</div>
          <div><strong>Bank Branch:</strong> {companyInfo.bankBranch || 'RAYAGADA BRANCH'}</div>
          <div style={{ marginTop: 4, color: '#475569', fontSize: 9 }}>
            {companyInfo.termsAndConditions?.split('\n')[0] || 'Check-out time is 11:00 AM sharp.'}
          </div>
        </div>

        {/* Middle: Bank Name & Dynamic QR Code */}
        <div
          style={{
            padding: '4px 8px',
            borderRight: '1px solid #000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 2 }}>
            Bank Name: Scan &amp; Pay
          </div>
          <img
            src={upiQrUrl}
            alt="UPI Payment QR Code"
            style={{ width: 72, height: 72, border: '1px solid #cbd5e1' }}
          />
          <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
            UPI: {companyInfo.upiId || '7999663696@YBL'}
          </div>
        </div>

        {/* Right: Seal & Stamp */}
        <div
          style={{
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800 }}>
            For {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
          </div>

          <div
            style={{
              border: '2px solid #581c87',
              borderRadius: 8,
              padding: '4px 10px',
              textAlign: 'center',
              background: '#faf5ff',
              margin: '4px 0'
            }}
          >
            <div style={{ fontSize: 8, color: '#2563eb', fontWeight: 800 }}>Payment Completed</div>
            <div style={{ fontSize: 16, color: '#16a34a' }}>🟢</div>
            <div style={{ fontSize: 8, color: '#475569' }}>Thank you! Visit again.</div>
          </div>

          <div style={{ fontSize: 9, color: '#64748b' }}>Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};

export const BillSignaturesThreeCol: React.FC<{ firmName?: string }> = ({ firmName }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', marginTop: 24, fontSize: 11, textAlign: 'center' }}>
      <div style={{ borderTop: '1px dashed #475569', paddingTop: 6, margin: '0 8px' }}>
        Guest Signature
      </div>
      <div style={{ borderTop: '1px dashed #475569', paddingTop: 6, margin: '0 8px' }}>
        Prepared / Cashier
      </div>
      <div style={{ borderTop: '1px dashed #475569', paddingTop: 6, margin: '0 8px', fontWeight: 800 }}>
        For {firmName || 'SRI SAI VASUDEV RESIDENCY'}
        <div style={{ fontSize: 10, fontWeight: 400, color: '#64748b', marginTop: 16 }}>Authorized Signatory</div>
      </div>
    </div>
  );
};

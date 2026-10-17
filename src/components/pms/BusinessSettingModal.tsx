import React, { useState, useEffect } from 'react';
import type { PmsBusinessSetting } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface BusinessSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: PmsBusinessSetting) => void;
}

export const BusinessSettingModal: React.FC<BusinessSettingModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [calculationType, setCalculationType] = useState<'12hour' | '24hour'>('12hour');
  const [standardCheckoutTime, setStandardCheckoutTime] = useState<string>('11:00 AM');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('11');
  const [selectedMin, setSelectedMin] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const HOURS = ['06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05'];
  const MINUTES = ['00', '01', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  useEffect(() => {
    if (isOpen) {
      const current = PmsStore.getBusinessSettings();
      setCalculationType(current.calculationType);
      setStandardCheckoutTime(current.standardCheckoutTime || '11:00 AM');
      setSuccessBanner(null);
      setTimePickerOpen(false);

      if (current.standardCheckoutTime) {
        const parts = current.standardCheckoutTime.split(/[:\s]+/);
        if (parts.length >= 2) {
          setSelectedHour(parts[0].padStart(2, '0'));
          setSelectedMin(parts[1].padStart(2, '0'));
        }
        if (/pm/i.test(current.standardCheckoutTime)) setSelectedAmPm('PM');
        else setSelectedAmPm('AM');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyTime = (h: string, m: string, ap: 'AM' | 'PM') => {
    setSelectedHour(h);
    setSelectedMin(m);
    setSelectedAmPm(ap);
    setStandardCheckoutTime(`${h}:${m} ${ap}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: PmsBusinessSetting = {
      calculationType,
      standardCheckoutTime,
      updatedAt: new Date().toISOString()
    };
    PmsStore.saveBusinessSettings(settings);
    setSuccessBanner(`Business Settings Applied! (${calculationType.toUpperCase()} Policy with checkout at ${standardCheckoutTime})`);

    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, height: 'auto', minHeight: 460 }}>
        {/* Header */}
        <header className="pms-header" style={{ background: '#212529', color: '#fff' }}>
          <div className="pms-header-left">
            <span style={{ fontSize: 16 }}>⚙️</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; BUSINESS SETTING (/businesssettings/create)
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

        {/* Success Banner */}
        {successBanner && (
          <div style={{ background: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc', padding: '10px 18px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {successBanner}</span>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              style={{ background: 'none', border: 'none', color: '#0f5132', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Box matching Video 09 Frames 0120 & 0200 */}
        <div style={{ padding: 24, background: '#f8f9fa', flex: 1 }}>
          <div style={{ maxWidth: 650, margin: '0 auto', background: '#fff', padding: 28, borderRadius: 6, border: '1px solid #dee2e6', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#212529', marginBottom: 24 }}>
              Business Setting
            </h2>

            <form onSubmit={handleSave}>
              {/* Row 1: Calculation Type & Standard Checkout Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6 }}>
                    Calculation Type
                  </label>
                  <select
                    value={calculationType}
                    onChange={e => setCalculationType(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 14 }}
                  >
                    <option value="12hour">12hour (Fixed Checkout Time Policy)</option>
                    <option value="24hour">24hour (Rolling Duration Policy)</option>
                  </select>
                  <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4 }}>
                    {calculationType === '12hour'
                      ? 'Stay is billed based on daily fixed checkout deadline (e.g. 11:00 AM).'
                      : 'Stay is billed per 24 elapsed hours from individual guest check-in time.'}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6 }}>
                    standard_checkout_time
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={standardCheckoutTime}
                      onClick={() => setTimePickerOpen(!timePickerOpen)}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: 4,
                        fontSize: 14,
                        cursor: 'pointer',
                        background: '#fff'
                      }}
                    />
                    <span
                      onClick={() => setTimePickerOpen(!timePickerOpen)}
                      style={{ marginLeft: -30, cursor: 'pointer', fontSize: 14, color: '#6c757d' }}
                    >
                      🕒
                    </span>
                  </div>

                  {/* Frame 0200 Popup Time Picker */}
                  {timePickerOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #ced4da',
                        borderRadius: 4,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        zIndex: 100,
                        display: 'flex',
                        marginTop: 4,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Hours Column */}
                      <div style={{ flex: 1, maxHeight: 180, overflowY: 'auto', borderRight: '1px solid #eee' }}>
                        <div style={{ padding: '4px 8px', fontSize: 10, background: '#f8f9fa', color: '#6c757d', textAlign: 'center' }}>HH</div>
                        {HOURS.map(h => (
                          <div
                            key={h}
                            onClick={() => handleApplyTime(h, selectedMin, selectedAmPm)}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'center',
                              fontSize: 12,
                              cursor: 'pointer',
                              background: selectedHour === h ? '#0d6efd' : 'transparent',
                              color: selectedHour === h ? '#fff' : '#333'
                            }}
                          >
                            {h}
                          </div>
                        ))}
                      </div>

                      {/* Minutes Column */}
                      <div style={{ flex: 1, maxHeight: 180, overflowY: 'auto', borderRight: '1px solid #eee' }}>
                        <div style={{ padding: '4px 8px', fontSize: 10, background: '#f8f9fa', color: '#6c757d', textAlign: 'center' }}>MM</div>
                        {MINUTES.map(m => (
                          <div
                            key={m}
                            onClick={() => handleApplyTime(selectedHour, m, selectedAmPm)}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'center',
                              fontSize: 12,
                              cursor: 'pointer',
                              background: selectedMin === m ? '#0d6efd' : 'transparent',
                              color: selectedMin === m ? '#fff' : '#333'
                            }}
                          >
                            {m}
                          </div>
                        ))}
                      </div>

                      {/* AM / PM Column */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '4px 8px', fontSize: 10, background: '#f8f9fa', color: '#6c757d', textAlign: 'center' }}>AM/PM</div>
                        <div
                          onClick={() => handleApplyTime(selectedHour, selectedMin, 'AM')}
                          style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: selectedAmPm === 'AM' ? '#0d6efd' : 'transparent',
                            color: selectedAmPm === 'AM' ? '#fff' : '#333'
                          }}
                        >
                          AM
                        </div>
                        <div
                          onClick={() => handleApplyTime(selectedHour, selectedMin, 'PM')}
                          style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: selectedAmPm === 'PM' ? '#0d6efd' : 'transparent',
                            color: selectedAmPm === 'PM' ? '#fff' : '#333'
                          }}
                        >
                          PM
                        </div>
                        <button
                          type="button"
                          onClick={() => setTimePickerOpen(false)}
                          style={{
                            marginTop: 'auto',
                            background: '#212529',
                            color: '#fff',
                            border: 'none',
                            padding: '4px',
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informational Policy Comparison Banner from Video 09 */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 4, marginBottom: 20, fontSize: 12, color: '#166534' }}>
                <strong>Policy Summary for Front Desk Staff:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li><strong>12-Hour Standard Checkout:</strong> If guest checks in at 6:00 PM on 9th June, Day 1 ends at 11:00 AM on 10th June. If checkout is delayed past 11:00 AM, Day 2 rent is automatically added to folio.</li>
                  <li><strong>24-Hour Rolling Stay:</strong> Full 24 hours provided from check-in (e.g. 6:00 PM on 9th to 6:00 PM on 10th).</li>
                </ul>
              </div>

              {/* Apply Button matching Video 09 Frame 0120 */}
              <button
                type="submit"
                style={{
                  background: '#0d6efd',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 28px',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#f8f9fa', padding: '10px 20px', borderTop: '1px solid #dee2e6', fontSize: 12, color: '#6c757d', textAlign: 'right' }}>
          HOTEL SAI VASUDEV RESIDENCY &bull; SHIRDI PMS SYSTEM
        </div>
      </div>
    </div>
  );
};

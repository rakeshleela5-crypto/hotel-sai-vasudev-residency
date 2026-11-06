import React, { useState, useEffect } from 'react';
import type { PmsCheckOutDetail, BillFormatType, PmsCompanyInfo } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface HotelBillFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCheckout?: PmsCheckOutDetail | null;
  initialFormat?: BillFormatType;
  onOpenBrandingSettings?: () => void;
}

export const HotelBillFormatModal: React.FC<HotelBillFormatModalProps> = ({
  isOpen,
  onClose,
  initialCheckout,
  initialFormat,
  onOpenBrandingSettings
}) => {
  const [checkouts, setCheckouts] = useState<PmsCheckOutDetail[]>([]);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>('');
  const [activeFormat, setActiveFormat] = useState<BillFormatType>('Format_3_A4_Standard');
  const [companyInfo, setCompanyInfo] = useState<PmsCompanyInfo>(PmsStore.getCompanyInfo());
  const [showPrintDialogOverlay, setShowPrintDialogOverlay] = useState(false);
  const [showSampleDemo, setShowSampleDemo] = useState(false);
  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
  const [printDestination, setPrintDestination] = useState('Canon LBP2900');
  const [margins, setMargins] = useState<'Default' | 'None' | 'Minimum'>('None');

  useEffect(() => {
    if (isOpen) {
      const allCheckouts = PmsStore.getCheckouts();
      setCheckouts(allCheckouts);
      const comp = PmsStore.getCompanyInfo();
      setCompanyInfo(comp);

      if (initialCheckout) {
        setSelectedInvoiceNo(initialCheckout.invoiceNo);
      } else if (allCheckouts.length > 0) {
        setSelectedInvoiceNo(allCheckouts[0].invoiceNo);
      }

      if (initialFormat) {
        setActiveFormat(initialFormat);
      } else {
        setActiveFormat(PmsStore.getDefaultBillFormat());
      }
    }
  }, [isOpen, initialCheckout, initialFormat]);

  if (!isOpen) return null;

  const DEMO_CHECKOUT: PmsCheckOutDetail = {
    invoiceNo: 'SVR/2025-26/INV-0001',
    roomNo: '101',
    roomType: 'Classic Deluxe AC',
    guestName: 'P. Venkata Rao',
    guestPhone: '9440289999',
    checkInDate: '08-05-2026',
    checkInTime: '10:25',
    checkOutDate: '09-05-2026',
    checkOutTime: '09:58',
    calculationType: '24hour',
    numberOfDays: 1,
    perDayTariff: 7000,
    totalRoomRent: 7000,
    foodAmount: 638,
    gstPercent: 5.0,
    gstAmount: 350,
    cgstAmount: 175,
    sgstAmount: 175,
    addOthers: 0,
    lessDiscount: 0,
    advanceDeducted: 0,
    billAmount: 8103,
    netPayable: 8103,
    paymentMode: 'Card',
    checkoutRemark: 'Checked out peacefully. All keys returned.',
    city: 'Rayagada',
    state: 'Odisha',
    country: 'India',
    pinCode: '765001',
    sacCode: '996311',
    invoiceFormat: 'A4_Standard'
  };

  const currentCheckout: PmsCheckOutDetail | undefined =
    checkouts.find(c => c.invoiceNo === selectedInvoiceNo) ||
    checkouts[0] ||
    initialCheckout ||
    (showSampleDemo ? DEMO_CHECKOUT : undefined);

  if (!currentCheckout) {
    return (
      <div className="pms-reg-modal-backdrop" onClick={onClose}>
        <div
          className="pms-reg-modal-window"
          style={{ maxWidth: '540px', padding: '32px', textAlign: 'center', background: '#ffffff', borderRadius: '8px', margin: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧾</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            No Checkout Invoices Found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
            There are currently no real checkout invoices in the system. Once a guest completes checkout at the front desk, their official GST tax invoices and printable vouchers will appear here.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setShowSampleDemo(true)}
              style={{ padding: '8px 20px', background: '#4338ca', color: '#ffffff', borderRadius: '6px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}
            >
              👁️ Preview Demo Templates (8 Formats)
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 20px', background: '#0f172a', color: '#ffffff', borderRadius: '6px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate day-wise breakdown rows with true calendar rollover arithmetic
  const generateStayDates = (startDateStr: string, totalDays: number): string[] => {
    const dates: string[] = [];
    if (!startDateStr) return dates;

    let baseDate: Date;
    if (startDateStr.includes('-')) {
      const parts = startDateStr.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        // DD-MM-YYYY
        const y = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
        baseDate = new Date(y, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    } else {
      baseDate = new Date();
    }

    if (isNaN(baseDate.getTime())) baseDate = new Date();

    for (let i = 0; i < Math.max(1, totalDays); i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      dates.push(`${day}-${month}-${year}`);
    }
    return dates;
  };

  const stayDates = generateStayDates(currentCheckout.checkInDate, currentCheckout.numberOfDays);
  const upiQrUrl = PmsStore.generateUpiPaymentQrUrl(
    currentCheckout.netPayable,
    currentCheckout.guestName,
    currentCheckout.invoiceNo
  );
  const sgstAmount = currentCheckout.sgstAmount ?? (currentCheckout.gstAmount ? currentCheckout.gstAmount / 2 : 0);
  const cgstAmount = currentCheckout.cgstAmount ?? (currentCheckout.gstAmount ? currentCheckout.gstAmount / 2 : 0);

  const formatRupeesToWords = (num: number): string => {
    const rounded = Math.round(num);
    if (rounded === 0) return 'Rupees Zero Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertBelowThousand = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (n < 20) {
          str += units[n] + ' ';
        } else {
          str += tens[Math.floor(n / 10)] + ' ' + (units[n % 10] ? units[n % 10] + ' ' : '');
        }
      }
      return str.trim();
    };

    let remainder = rounded;
    let words = '';

    if (remainder >= 10000000) {
      const crores = Math.floor(remainder / 10000000);
      words += convertBelowThousand(crores) + ' Crore ';
      remainder %= 10000000;
    }

    if (remainder >= 100000) {
      const lakhs = Math.floor(remainder / 100000);
      words += convertBelowThousand(lakhs) + ' Lakh ';
      remainder %= 100000;
    }

    if (remainder >= 1000) {
      const thousands = Math.floor(remainder / 1000);
      words += convertBelowThousand(thousands) + ' Thousand ';
      remainder %= 1000;
    }

    if (remainder > 0) {
      words += convertBelowThousand(remainder);
    }

    return `Rupees ${words.trim()} Only`;
  };

  const getRouteLabel = () => {
    switch (activeFormat) {
      case 'Format_1_DayWise':
        return `pms.hotelsai-vasudev.com/room_checkout_view2/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '252'}`;
      case 'Format_2_Summary':
        return `pms.hotelsai-vasudev.com/room_checkout_view/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '238'}`;
      case 'Format_3_A4_Standard':
        return `pms.hotelsai-vasudev.com/room_checkout_view3/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '238'}`;
      case 'Format_4_A5_Compact':
        return `pms.hotelsai-vasudev.com/room_checkout_view4/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '238'}`;
      case 'Format_5_Enterprise_Folio':
        return `pms.hotelsai-vasudev.com/enterprise_folio/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '903'}`;
      case 'Format_6_Restaurant_DineIn':
        return `pms.hotelsai-vasudev.com/restaurant_bill/1032`;
      case 'Format_7_RoomService':
        return `pms.hotelsai-vasudev.com/room_service_bill/1059`;
      case 'Format_8_Card_EDC_Slip':
        return `pms.hotelsai-vasudev.com/pos_card_slip/008106`;
    }
  };

  const handlePrint = () => {
    setShowPrintDialogOverlay(true);
  };

  const handleExecutePrint = () => {
    setShowPrintDialogOverlay(false);
    window.print();
  };

  const handleWhatsAppSend = () => {
    PmsStore.sendWhatsAppNotification({
      voucherType: 'Check_out_store',
      recipientMobile: currentCheckout.guestPhone,
      recipientName: currentCheckout.guestName,
      voucherNo: currentCheckout.invoiceNo,
      roomNo: currentCheckout.roomNo,
      templateParams: {
        checkout_date: currentCheckout.checkOutDate,
        total_billamount: currentCheckout.netPayable.toFixed(2)
      },
      openDirectly: true
    });
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: activeFormat === 'Format_4_A5_Compact' ? 760 : 980,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f1f5f9',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Browser URL bar & Header matching Video 26 Frames 0115, 0180 */}
        <header
          style={{
            background: '#1e293b',
            color: '#fff',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 16 }}>🧾</span>
            <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
              HOTEL &amp; RESTAURANT PMS &bull; BILL FORMAT VIEWER
            </span>
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 11,
                color: '#38bdf8',
                fontFamily: 'monospace',
                marginLeft: 10
              }}
            >
              🌐 https://{getRouteLabel()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleWhatsAppSend}
              style={{
                background: '#25d366',
                color: '#fff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Open current bill in WhatsApp Web via wa.me (Option 1: 100% Free)"
            >
              <span>💬</span> WhatsApp Bill (wa.me)
            </button>
            {onOpenBrandingSettings && (
              <button
                type="button"
                onClick={onOpenBrandingSettings}
                style={{
                  background: '#ca8a04',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Configure Bank Details, QR Code, Logo, and Terms in Settings (/comp_pic_form)"
              >
                ⚙️ Branding / Bank Settings
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="pms-close-btn"
              title="Close Viewer"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Top Control Bar: Checkout Selector & Format Switcher */}
        <div
          style={{
            background: '#0f172a',
            padding: '8px 14px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            borderBottom: '1px solid #334155',
            color: '#fff',
            fontSize: 12
          }}
        >
          {/* Checkout Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontWeight: 700, color: '#94a3b8' }}>Select Guest Checkout:</label>
            <select
              value={selectedInvoiceNo}
              onChange={e => setSelectedInvoiceNo(e.target.value)}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {checkouts.map(c => (
                <option key={c.invoiceNo} value={c.invoiceNo}>
                  {c.invoiceNo} &bull; Room {c.roomNo} &bull; {c.guestName} (₹{c.netPayable.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Format Tabs (Matching Video 26 Minute 03:00 - 07:00) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: '#94a3b8', marginRight: 4 }}>Bill Format:</span>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_1_DayWise')}
              style={{
                background: activeFormat === 'Format_1_DayWise' ? '#ca8a04' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_1_DayWise' ? '1px solid #facc15' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Format 1 (Day-wise / View 2)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_2_Summary')}
              style={{
                background: activeFormat === 'Format_2_Summary' ? '#2563eb' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_2_Summary' ? '1px solid #60a5fa' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Format 2 (Summary)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_3_A4_Standard')}
              style={{
                background: activeFormat === 'Format_3_A4_Standard' ? '#16a34a' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_3_A4_Standard' ? '1px solid #4ade80' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Format 3 (A4 Standard ★)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_4_A5_Compact')}
              style={{
                background: activeFormat === 'Format_4_A5_Compact' ? '#ca8a04' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_4_A5_Compact' ? '1px solid #fde047' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Format 4 (A5 Compact)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_5_Enterprise_Folio')}
              style={{
                background: activeFormat === 'Format_5_Enterprise_Folio' ? '#4338ca' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_5_Enterprise_Folio' ? '1px solid #818cf8' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Format 5 (Enterprise Folio ★)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_6_Restaurant_DineIn')}
              style={{
                background: activeFormat === 'Format_6_Restaurant_DineIn' ? '#059669' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_6_Restaurant_DineIn' ? '1px solid #34d399' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Format 6 (Dine-In Doc 1 ★)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_7_RoomService')}
              style={{
                background: activeFormat === 'Format_7_RoomService' ? '#ea580c' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_7_RoomService' ? '1px solid #fb923c' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Format 7 (Room Service Doc 2 ★)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('Format_8_Card_EDC_Slip')}
              style={{
                background: activeFormat === 'Format_8_Card_EDC_Slip' ? '#0284c7' : '#1e293b',
                color: '#fff',
                border: activeFormat === 'Format_8_Card_EDC_Slip' ? '1px solid #38bdf8' : '1px solid #475569',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Format 8 (Card EDC Doc 4 ★)
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div
          id="printable-hotel-bill"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            background: '#cbd5e1',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {/* Bill Paper Container */}
          <div
            style={{
              width: activeFormat === 'Format_4_A5_Compact' ? 580 : 820,
              minHeight: activeFormat === 'Format_4_A5_Compact' ? 680 : 960,
              background: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: activeFormat === 'Format_4_A5_Compact' ? '14px 18px' : '20px 24px',
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box'
            }}
          >
            {/* ========================================================================= */}
            {/* FORMAT 1: DAY-WISE BREAKDOWN (/room_checkout_view2 - Frames 0115, 0120, 0125) */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_1_DayWise' && (
              <div>
                {/* Yellow Header Banner matching Frame 0115 */}
                <div
                  style={{
                    background: '#ffff88',
                    border: '1px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: 8
                  }}
                >
                  {/* Left Logo / Crest */}
                  <div
                    style={{
                      width: 90,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {companyInfo.logoUrl ? (
                      <img
                        src={companyInfo.logoUrl}
                        alt="Logo"
                        style={{ maxWidth: 80, maxHeight: 60, objectFit: 'contain' }}
                      />
                    ) : (
                      <div
                        style={{
                          color: '#b45309',
                          fontWeight: 900,
                          textAlign: 'center',
                          fontSize: 12,
                          lineHeight: 1.2
                        }}
                      >
                        <div style={{ fontSize: 20 }}>⚜️</div>
                        VASUH
                      </div>
                    )}
                  </div>

                  {/* Center Hotel Name & Address */}
                  <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                    <h1
                      style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: '#000'
                      }}
                    >
                      {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                    </h1>
                    <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>
                      {companyInfo.address1 || 'Near Andhra Bank, New Colony'},{' '}
                      {companyInfo.address2 || 'SRI SAI VASUDEV RESIDENCY'}, {companyInfo.city || 'Rayagada'},{' '}
                      {companyInfo.state || 'ODISHA'} {companyInfo.pincode || '765001'}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      India Email: {companyInfo.email || 'reservations@hotelsai-vasudev.com'} Phone Mobile {companyInfo.mobile || '+91 94402 89999'}
                    </div>
                  </div>
                </div>

                {/* Metadata Grid matching Frame 0115 */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 11,
                    marginBottom: 8,
                    border: '1px solid #000'
                  }}
                >
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000', width: '33%' }}>
                        <strong>G.R.C.No:</strong> {currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '220'}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000', width: '34%' }}>
                        <strong>Bill No:</strong> {currentCheckout.invoiceNo}
                      </td>
                      <td style={{ padding: '3px 6px', width: '33%' }}>
                        <strong>Bill Date:</strong> {currentCheckout.checkOutDate}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        <strong>Room No:</strong> {currentCheckout.roomNo}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        <strong>Guest Name:</strong> {currentCheckout.guestName}
                      </td>
                      <td style={{ padding: '3px 6px' }}>
                        <strong>Room Tariff:</strong> {currentCheckout.perDayTariff.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        <strong>Room Type:</strong> {currentCheckout.roomType}
                      </td>
                      <td colSpan={2} style={{ padding: '3px 6px' }}>
                        <strong>Nationality:</strong> India
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td colSpan={3} style={{ padding: '3px 6px' }}>
                        <strong>Address:</strong> {currentCheckout.city}, {currentCheckout.state} - {currentCheckout.pinCode}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        <strong>Arrival Date &amp; Time:</strong> {currentCheckout.checkInDate} {currentCheckout.checkInTime}
                      </td>
                      <td colSpan={2} style={{ padding: '3px 6px' }}>
                        <strong>Deparcher Date And Time:</strong> {currentCheckout.checkOutDate} {currentCheckout.checkOutTime}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        <strong>Company GSTIN NO:</strong> {companyInfo.gstNo}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        <strong>Mobile:</strong> {currentCheckout.guestPhone}
                      </td>
                      <td style={{ padding: '3px 6px' }}>
                        <strong>Plan &amp; Package:</strong> WITH BREAKFAST|| WITH BREAKFAST|| 500
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Day-Wise Stay Itemization Table matching Frame 0115 */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 11,
                    marginBottom: 10,
                    border: '1px solid #000'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 8px', borderRight: '1px solid #000', width: 100, textAlign: 'left' }}>
                        Date
                      </th>
                      <th style={{ padding: '4px 8px', borderRight: '1px solid #000', width: 100, textAlign: 'center' }}>
                        SAC Code
                      </th>
                      <th style={{ padding: '4px 8px', borderRight: '1px solid #000', textAlign: 'left' }}>
                        Description
                      </th>
                      <th style={{ padding: '4px 8px', width: 130, textAlign: 'right' }}>
                        Per Day Charge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stayDates.map((dateStr, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>{dateStr}</td>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000', textAlign: 'center' }}>
                          {currentCheckout.sacCode || '996311'}
                        </td>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>Room Charge</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 600 }}>
                          {currentCheckout.perDayTariff.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sub-Total & Calculations Summary Block matching Frame 0125 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <table
                    style={{
                      width: 320,
                      borderCollapse: 'collapse',
                      fontSize: 11,
                      border: '1px solid #000'
                    }}
                  >
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>Total Room Tariff</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {currentCheckout.totalRoomRent.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>SGST</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {sgstAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>CGST</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {cgstAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>IGST</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>0.00</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>Add Other Charge</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {currentCheckout.addOthers > 0 ? currentCheckout.addOthers.toFixed(2) : ''}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>Total Food Amount</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {currentCheckout.foodAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>Less Discount</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {currentCheckout.lessDiscount > 0 ? `-${currentCheckout.lessDiscount.toFixed(2)}` : ''}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000', fontWeight: 800 }}>
                        <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>Net Bill Amount</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                          {currentCheckout.billAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <td style={{ padding: '3px 8px', borderRight: '1px solid #000' }}>Less Advance</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right' }}>
                          {currentCheckout.advanceDeducted.toFixed(2)}
                        </td>
                      </tr>
                      <tr style={{ background: '#f8fafc', fontWeight: 900, fontSize: 13 }}>
                        <td style={{ padding: '6px 8px', borderRight: '1px solid #000' }}>Net Payable Amount</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#16a34a' }}>
                          {currentCheckout.netPayable.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terms, Bank Details, Dynamic UPI QR & Payment Seal matching Frame 0125 */}
                <div
                  style={{
                    border: '1px solid #000',
                    fontSize: 10,
                    marginBottom: 6
                  }}
                >
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

                      {/* Payment Completed Seal Stamp matching Frame 0125 & 0240 */}
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
              </div>
            )}

            {/* ========================================================================= */}
            {/* FORMAT 2: GENERAL INVOICE SUMMARY (/room_checkout_view - Frames 0170, 0180) */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_2_Summary' && (
              <div>
                {/* Header matching Frame 0170 */}
                <div
                  style={{
                    border: '1px solid #000',
                    padding: 8,
                    marginBottom: 8,
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, position: 'absolute', left: 8, top: 6 }}>
                    GST NO: {companyInfo.gstNo}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                    INVOICE
                  </div>
                  <h2 style={{ margin: '2px 0', fontSize: 18, fontWeight: 900 }}>
                    {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                  </h2>
                  <div style={{ fontSize: 10 }}>
                    {companyInfo.address1}, {companyInfo.city} - {companyInfo.pincode} ({companyInfo.state})
                  </div>
                  <div style={{ fontSize: 10 }}>
                    India Email: {companyInfo.email} Phone Mobile {companyInfo.mobile}
                  </div>

                  {/* Logo on Left */}
                  <div style={{ position: 'absolute', left: 8, bottom: 6, fontSize: 10, fontWeight: 800, color: '#b45309' }}>
                    ⚜️ {companyInfo.firmName?.slice(0, 5) || 'VASUH'}
                  </div>
                  {/* QR on Right Top */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 6,
                      border: '1px solid #94a3b8',
                      padding: '2px 6px',
                      fontSize: 9,
                      background: '#f8fafc'
                    }}
                  >
                    [qr_code]
                  </div>
                </div>

                {/* 2-Column Guest Detail & Stay Detail matching Frame 0170 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 11 }}>
                    <div style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 4 }}>
                      Guest Detail
                    </div>
                    <div><strong>Guest Name:</strong> {currentCheckout.guestName}</div>
                    <div><strong>Add:</strong> {currentCheckout.city}</div>
                    <div><strong>city:</strong> {currentCheckout.city}</div>
                    <div><strong>State:</strong> {currentCheckout.state}</div>
                    <div><strong>Mob:</strong> {currentCheckout.guestPhone}</div>
                    <div><strong>Email:</strong> -</div>
                    <div><strong>GST NO:</strong> {companyInfo.gstNotApplicable ? 'N/A' : companyInfo.gstNo}</div>
                  </div>

                  <div style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 11 }}>
                    <div style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 4 }}>
                      Detail
                    </div>
                    <div><strong>Invoice No:</strong> {currentCheckout.invoiceNo}</div>
                    <div><strong>Check In Date:</strong> {currentCheckout.checkInDate}</div>
                    <div><strong>Check In Time:</strong> {currentCheckout.checkInTime}</div>
                    <div><strong>Check Out Date:</strong> {currentCheckout.checkOutDate}</div>
                    <div><strong>Check Out Time:</strong> {currentCheckout.checkOutTime}</div>
                    <div><strong>Total Day:</strong> {currentCheckout.numberOfDays}</div>
                    <div><strong>Room No:</strong> {currentCheckout.roomNo}</div>
                  </div>
                </div>

                {/* Particulars Table matching Frame 0170 */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 11,
                    marginBottom: 8,
                    border: '1px solid #000'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', width: 45 }}>S.No</th>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', textAlign: 'left' }}>Particulars</th>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', width: 60, textAlign: 'center' }}>Days</th>
                      <th style={{ padding: '4px 6px', width: 110, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>
                        Room Rent Per Day - {currentCheckout.perDayTariff.toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000', textAlign: 'center' }}>
                        {currentCheckout.numberOfDays}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>
                        {currentCheckout.totalRoomRent.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>GST %</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>{currentCheckout.gstAmount.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>Total Room Tariff</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                        {(currentCheckout.totalRoomRent + currentCheckout.gstAmount).toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>Food Amount</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>{currentCheckout.foodAmount.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>Add Other Charge</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                        {currentCheckout.addOthers > 0 ? currentCheckout.addOthers.toFixed(2) : ''}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>Less Discount</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                        {currentCheckout.lessDiscount > 0 ? `-${currentCheckout.lessDiscount.toFixed(2)}` : ''}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000', fontWeight: 800, background: '#f1f5f9' }}>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontSize: 12 }}>Net Bill Amount</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 12 }}>
                        {currentCheckout.billAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}>Less Advance</td>
                      <td style={{ padding: '3px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', color: '#b91c1c' }}>
                        {currentCheckout.advanceDeducted > 0 ? `-${currentCheckout.advanceDeducted.toFixed(2)}` : '0.00'}
                      </td>
                    </tr>
                    <tr style={{ background: '#e2e8f0', fontWeight: 900, fontSize: 13 }}>
                      <td style={{ padding: '6px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '6px 6px', borderRight: '1px solid #000' }}>Net Payable Amount</td>
                      <td style={{ padding: '6px 6px', borderRight: '1px solid #000' }}></td>
                      <td style={{ padding: '6px 6px', textAlign: 'right', color: '#16a34a' }}>
                        {currentCheckout.netPayable.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer matching Frame 0170 & 0180 */}
                <div style={{ border: '1px solid #000', fontSize: 10 }}>
                  <div style={{ background: '#f8fafc', padding: '3px 8px', fontWeight: 800, textAlign: 'center', borderBottom: '1px solid #000' }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.4fr', minHeight: 85 }}>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #000', lineHeight: 1.4 }}>
                      <div>Bank Name: {companyInfo.bankName || 'STATE BANK OF INDIA'}</div>
                      <div>Bank A/C No: {companyInfo.bankAccountNo || '923020035404769'}</div>
                      <div>Bank IFSC: {companyInfo.bankIfsc || 'SBIN000390'}</div>
                      <div>Bank Branch: {companyInfo.bankBranch || 'MAIN BRANCH HARIDWAR'}</div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRight: '1px solid #000', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 700 }}>Bank Name:</div>
                      <img src={upiQrUrl} alt="QR" style={{ width: 68, height: 68, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 10, fontWeight: 800 }}>For {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}</div>
                      <div style={{ border: '2px solid #581c87', borderRadius: 6, padding: '2px 8px', background: '#faf5ff', textAlign: 'center' }}>
                        <div style={{ fontSize: 7, color: '#2563eb', fontWeight: 800 }}>Payment Completed</div>
                        <div style={{ fontSize: 14 }}>🟢</div>
                        <div style={{ fontSize: 7 }}>Thank you!</div>
                      </div>
                      <div style={{ fontSize: 8 }}>Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FORMAT 3: A4 STANDARD RECOMMENDED (/room_checkout_view3 - Frames 0195, 0215) */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_3_A4_Standard' && (
              <div>
                {/* Hotel Brand Header matching Frame 0195 */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  >
                    {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                  </h1>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    {companyInfo.address1}, {companyInfo.city} - {companyInfo.pincode} ({companyInfo.state})
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                    Phone Mobile {companyInfo.mobile} website {companyInfo.website} India Email: {companyInfo.email}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                    GSTIN: {companyInfo.gstNo} &bull; STATE CODE: {companyInfo.companyGstCode || '21'}
                  </div>
                </div>

                {/* 2-Column Split Details Box matching Frame 0195 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: 12,
                    border: '1px solid #000',
                    padding: '6px 10px',
                    fontSize: 11,
                    marginBottom: 8
                  }}
                >
                  <div style={{ lineHeight: 1.5 }}>
                    <div><strong>Invoice No:</strong> {currentCheckout.invoiceNo}</div>
                    <div><strong>Room No:</strong> {currentCheckout.roomNo}</div>
                    <div><strong>Guest Name:</strong> {currentCheckout.guestName}</div>
                    <div><strong>Company:</strong> -</div>
                    <div><strong>Address:</strong> {currentCheckout.city}</div>
                    <div><strong>City:</strong> {currentCheckout.city}</div>
                    <div><strong>State:</strong> {currentCheckout.state}</div>
                    <div><strong>Mobile:</strong> {currentCheckout.guestPhone}</div>
                    <div><strong>Email:</strong> -</div>
                    <div><strong>Party's GSTIN:</strong> {companyInfo.gstNotApplicable ? 'N/A' : '-'}</div>
                  </div>

                  <div style={{ lineHeight: 1.5 }}>
                    <div><strong>Invoice Date:</strong> {currentCheckout.checkOutDate}</div>
                    <div><strong>Arrival Date:</strong> {currentCheckout.checkInDate}</div>
                    <div><strong>Arrival Time:</strong> {currentCheckout.checkInTime}</div>
                    <div><strong>Departure Date:</strong> {currentCheckout.checkOutDate}</div>
                    <div><strong>Departure Time:</strong> {currentCheckout.checkOutTime}</div>
                    <div><strong>Billing Officer:</strong> Admin</div>
                    <div><strong>Tariff Plan:</strong> EP (Room Only) / CP</div>
                  </div>
                </div>

                {/* Main Particulars Table matching Frame 0195 */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 11,
                    marginBottom: 6,
                    border: '1px solid #000'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', width: 40 }}>S.No</th>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', textAlign: 'left' }}>Particulars</th>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', width: 50, textAlign: 'center' }}>Days</th>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', width: 80, textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '4px 6px', borderRight: '1px solid #000', width: 70, textAlign: 'center' }}>GST</th>
                      <th style={{ padding: '4px 6px', width: 110, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', fontWeight: 700 }}>
                        {currentCheckout.roomType}
                      </td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', textAlign: 'center' }}>
                        {currentCheckout.numberOfDays}
                      </td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', textAlign: 'right' }}>
                        {currentCheckout.perDayTariff.toFixed(2)}
                      </td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #000', textAlign: 'center' }}>
                        {currentCheckout.gstPercent.toFixed(2)}%
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800 }}>
                        {currentCheckout.totalRoomRent.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotals & Taxes calculation breakdown matching Frame 0195 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <table style={{ width: 260, fontSize: 10, lineHeight: 1.6 }}>
                    <tbody>
                      <tr>
                        <td>SGST:</td>
                        <td style={{ textAlign: 'right' }}>{sgstAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>CGST:</td>
                        <td style={{ textAlign: 'right' }}>{cgstAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>IGST:</td>
                        <td style={{ textAlign: 'right' }}>0.00</td>
                      </tr>
                      <tr>
                        <td>Food Amount:</td>
                        <td style={{ textAlign: 'right' }}>{currentCheckout.foodAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Add Other Charge:</td>
                        <td style={{ textAlign: 'right' }}>{currentCheckout.addOthers > 0 ? currentCheckout.addOthers.toFixed(2) : '0.00'}</td>
                      </tr>
                      <tr>
                        <td>Less Discount:</td>
                        <td style={{ textAlign: 'right' }}>{currentCheckout.lessDiscount > 0 ? `-${currentCheckout.lessDiscount.toFixed(2)}` : '0.00'}</td>
                      </tr>
                      <tr style={{ fontWeight: 800, borderTop: '1px solid #000', paddingTop: 2 }}>
                        <td>Net Bill Amount:</td>
                        <td style={{ textAlign: 'right' }}>{currentCheckout.billAmount.toFixed(2)}</td>
                      </tr>
                      <tr style={{ color: '#b91c1c' }}>
                        <td>Less Advance:</td>
                        <td style={{ textAlign: 'right' }}>
                          {currentCheckout.advanceDeducted > 0 ? `-${currentCheckout.advanceDeducted.toFixed(2)}` : '0.00'}
                        </td>
                      </tr>
                      <tr style={{ fontWeight: 900, fontSize: 12, borderTop: '1px solid #000', color: '#16a34a' }}>
                        <td>Net Payable Amount:</td>
                        <td style={{ textAlign: 'right' }}>{currentCheckout.netPayable.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Dedicated GST Breakdown Table matching Frame 0195 */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 10,
                    marginBottom: 8,
                    border: '1px solid #000'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '3px 4px', borderRight: '1px solid #000' }}>SAC Code</th>
                      <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>Taxable Amount</th>
                      <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>GST%</th>
                      <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>SGST</th>
                      <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>CGST</th>
                      <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>IGST</th>
                      <th style={{ padding: '3px 4px', textAlign: 'right' }}>Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 700 }}>
                        {currentCheckout.sacCode || '996311'}
                      </td>
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>
                        {currentCheckout.totalRoomRent.toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>
                        {currentCheckout.gstPercent.toFixed(2)}%
                      </td>
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>
                        {sgstAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>
                        {cgstAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>0.00</td>
                      <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>
                        {currentCheckout.gstAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Key Drop Box & Payment Completed Stamp matching Frame 0195 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    border: '1px solid #000',
                    padding: 8,
                    marginBottom: 10
                  }}
                >
                  {/* Left: Key Drop Reminder with Key Icon */}
                  <div
                    style={{
                      borderRight: '1px solid #cbd5e1',
                      paddingRight: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: 28 }}>🗝️</span>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#1e293b', letterSpacing: 0.5 }}>
                      PLEASE REMEMBER TO DROP YOUR KEYS AT FRONT DESK
                    </div>
                  </div>

                  {/* Right: Payment Completed Stamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      style={{
                        border: '2px solid #581c87',
                        borderRadius: 8,
                        padding: '4px 14px',
                        background: '#faf5ff',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: 8, color: '#2563eb', fontWeight: 800 }}>Payment Completed</div>
                      <div style={{ fontSize: 16, color: '#16a34a' }}>🟢</div>
                      <div style={{ fontSize: 8, color: '#475569' }}>Thank you! Visit again.</div>
                    </div>
                  </div>
                </div>

                {/* Dual Signature Lines matching Frame 0195 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '14px 20px 6px',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  <div style={{ borderTop: '1px solid #000', width: 140, textAlign: 'center', paddingTop: 2 }}>
                    Guest Signature
                  </div>
                  <div style={{ borderTop: '1px solid #000', width: 140, textAlign: 'center', paddingTop: 2 }}>
                    Authorized Signatory
                  </div>
                </div>

                {/* Footer Banner matching Frame 0195 */}
                <div
                  style={{
                    borderTop: '1px solid #000',
                    paddingTop: 4,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: 1
                  }}
                >
                  Thank You For Staying With Us
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FORMAT 4: A5 COMPACT HALF-PAGE (/room_checkout_view4 - Frame 0215) */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_4_A5_Compact' && (
              <div>
                {/* Compact A5 Header */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
                    {companyInfo.firmName}
                  </h2>
                  <div style={{ fontSize: 9 }}>
                    {companyInfo.address1}, {companyInfo.city} - {companyInfo.pincode} &bull; Mob: {companyInfo.mobile}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700 }}>
                    GSTIN: {companyInfo.gstNo} | TAX INVOICE (A5 HALF SHEET)
                  </div>
                </div>

                {/* Compact Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    fontSize: 9,
                    border: '1px solid #000',
                    padding: 4,
                    marginBottom: 6
                  }}
                >
                  <div>
                    <div><strong>Inv No:</strong> {currentCheckout.invoiceNo}</div>
                    <div><strong>Guest:</strong> {currentCheckout.guestName}</div>
                    <div><strong>Room:</strong> {currentCheckout.roomNo} ({currentCheckout.roomType})</div>
                    <div><strong>Mob:</strong> {currentCheckout.guestPhone}</div>
                  </div>
                  <div>
                    <div><strong>Date:</strong> {currentCheckout.checkOutDate}</div>
                    <div><strong>In:</strong> {currentCheckout.checkInDate} {currentCheckout.checkInTime}</div>
                    <div><strong>Out:</strong> {currentCheckout.checkOutDate} {currentCheckout.checkOutTime}</div>
                    <div><strong>Days:</strong> {currentCheckout.numberOfDays}</div>
                  </div>
                </div>

                {/* Compact Table */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 9,
                    border: '1px solid #000',
                    marginBottom: 6
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '2px 4px', borderRight: '1px solid #000', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '2px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>Days</th>
                      <th style={{ padding: '2px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>Tariff</th>
                      <th style={{ padding: '2px 4px', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>Room Rent (SAC 996311)</td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000', textAlign: 'center' }}>
                        {currentCheckout.numberOfDays}
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000', textAlign: 'right' }}>
                        {currentCheckout.perDayTariff.toFixed(2)}
                      </td>
                      <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>
                        {currentCheckout.totalRoomRent.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotals & Taxes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 6 }}>
                  <div style={{ width: '50%', paddingRight: 6 }}>
                    <div><strong>Bank:</strong> {companyInfo.bankName || 'SBI'} A/C: {companyInfo.bankAccountNo}</div>
                    <div><strong>IFSC:</strong> {companyInfo.bankIfsc}</div>
                    <div style={{ marginTop: 2, color: '#475569' }}>Drop room keys at reception desk.</div>
                  </div>
                  <div style={{ width: '45%', lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST:</span> <span>{sgstAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST:</span> <span>{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Food:</span> <span>{currentCheckout.foodAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Bill Total:</span> <span>{currentCheckout.billAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                      <span>Less Advance:</span> <span>-{currentCheckout.advanceDeducted.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 11, color: '#16a34a', borderTop: '1px solid #000', paddingTop: 2 }}>
                      <span>Net Payable:</span> <span>₹{currentCheckout.netPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 10, paddingTop: 4, borderTop: '1px solid #cbd5e1' }}>
                  <span>Guest Signature</span>
                  <span>Payment Completed &bull; Auth Signatory</span>
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', textAlign: 'center', marginTop: 4, textTransform: 'uppercase' }}>
                  The registration certificate is required to be prominently displayed at all places of business in the State
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FORMAT 5: ENTERPRISE MASTER TAX INVOICE & FOLIO (MATCHING DOCUMENT 3)      */}
            {/* Continuous-Feed Dot-Matrix Ledger with Voucher Postings & Dual Tax Box     */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_5_Enterprise_Folio' && (() => {
              const roomTariff = currentCheckout.totalRoomRent || (currentCheckout.perDayTariff * currentCheckout.numberOfDays);
              const roomCgst = currentCheckout.cgstAmount ?? (currentCheckout.gstAmount ? currentCheckout.gstAmount / 2 : 0);
              const roomSgst = currentCheckout.sgstAmount ?? (currentCheckout.gstAmount ? currentCheckout.gstAmount / 2 : 0);

              const foodTotal = currentCheckout.foodAmount || 0;
              const foodTaxable = foodTotal > 0 ? Number((foodTotal / 1.05).toFixed(2)) : 0;
              const foodTax = Number((foodTotal - foodTaxable).toFixed(2));
              const foodCgst = Number((foodTax / 2).toFixed(2));
              const foodSgst = Number((foodTax / 2).toFixed(2));

              const advance = currentCheckout.advanceDeducted || 0;
              const totalDebits = roomTariff + roomCgst + roomSgst + foodTotal + (currentCheckout.addOthers || 0) - (currentCheckout.lessDiscount || 0);
              const totalCredits = advance;
              const netPayableAmt = currentCheckout.netPayable;
              const totalTaxCollected = roomCgst + roomSgst + (foodTotal > 0 ? foodTax : 0);

              // Construct chronological ledger entries matching Document 3 (Image 3)
              let runningBal = 0;
              const ledgerRows: Array<{
                date: string;
                voucher: string;
                description: string;
                sac: string;
                debit: number;
                credit: number;
                balance: number;
              }> = [];

              // 1. Room Tariff
              runningBal += roomTariff;
              ledgerRows.push({
                date: currentCheckout.checkInDate,
                voucher: '',
                description: `Tariff: ${currentCheckout.roomNo}`,
                sac: '996311',
                debit: roomTariff,
                credit: 0,
                balance: runningBal
              });

              // 2. Room CGST
              runningBal += roomCgst;
              ledgerRows.push({
                date: currentCheckout.checkInDate,
                voucher: '',
                description: 'Central GST @ 6.00%',
                sac: '996311',
                debit: roomCgst,
                credit: 0,
                balance: runningBal
              });

              // 3. Room SGST
              runningBal += roomSgst;
              ledgerRows.push({
                date: currentCheckout.checkInDate,
                voucher: '',
                description: 'State GST @ 6.00%',
                sac: '996311',
                debit: roomSgst,
                credit: 0,
                balance: runningBal
              });

              // 4. Restaurant F&B Cross-Posting (Document 1 Voucher 1032 / PEARL)
              if (foodTotal > 0) {
                runningBal += foodTaxable;
                ledgerRows.push({
                  date: currentCheckout.checkInDate,
                  voucher: 'VR/1032',
                  description: 'Vasudev Rasoi (Restaurant Dine-In)',
                  sac: '996331',
                  debit: foodTaxable,
                  credit: 0,
                  balance: runningBal
                });

                runningBal += foodCgst;
                ledgerRows.push({
                  date: currentCheckout.checkInDate,
                  voucher: '1032',
                  description: 'Central GST @ 2.50%',
                  sac: '',
                  debit: foodCgst,
                  credit: 0,
                  balance: runningBal
                });

                runningBal += foodSgst;
                ledgerRows.push({
                  date: currentCheckout.checkInDate,
                  voucher: '1032',
                  description: 'State GST @ 2.50%',
                  sac: '',
                  debit: foodSgst,
                  credit: 0,
                  balance: runningBal
                });
              }

              // 5. Miscellaneous / Laundry if any
              if ((currentCheckout.addOthers || 0) > 0) {
                runningBal += currentCheckout.addOthers;
                ledgerRows.push({
                  date: currentCheckout.checkInDate,
                  voucher: 'MISC',
                  description: 'Laundry & Room Amenities',
                  sac: '9997',
                  debit: currentCheckout.addOthers,
                  credit: 0,
                  balance: runningBal
                });
              }

              // 6. Promotional Discount if any
              if ((currentCheckout.lessDiscount || 0) > 0) {
                runningBal -= currentCheckout.lessDiscount;
                ledgerRows.push({
                  date: currentCheckout.checkInDate,
                  voucher: 'DISC',
                  description: 'Less: Courtesy Pilgrim Discount',
                  sac: '',
                  debit: 0,
                  credit: currentCheckout.lessDiscount,
                  balance: runningBal
                });
              }

              // 7. Advance Settlement (Credit line)
              if (advance > 0) {
                runningBal -= advance;
                ledgerRows.push({
                  date: currentCheckout.checkInDate,
                  voucher: 'AR/101',
                  description: 'Advance Deposit Received & Settled',
                  sac: '',
                  debit: 0,
                  credit: advance,
                  balance: runningBal
                });
              }

              return (
                <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: '#000000', lineHeight: 1.35 }}>
                  {/* Top Tax Invoice Title */}
                  <div style={{ textAlign: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, textDecoration: 'underline' }}>
                      TAX INVOICE
                    </span>
                  </div>

                  {/* Header: Logo, Trade Name, Legal Entity, Contacts & GSTIN */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 58,
                        height: 58,
                        background: '#0f172a',
                        color: '#facc15',
                        border: '2px solid #000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 12
                      }}>
                        <span style={{ fontSize: 18 }}>⚜️</span>
                        <span style={{ fontSize: 9, letterSpacing: 1 }}>SVR</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.5 }}>
                          {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>
                          PROPRIETOR: {companyInfo.legalName || 'PAIDISETTY MANMADHA RAO'}
                        </div>
                        <div style={{ fontSize: 10, color: '#334155' }}>
                          {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY'}
                        </div>
                        <div style={{ fontSize: 10, color: '#334155' }}>
                          {companyInfo.city || 'Rayagada'}, {companyInfo.state || 'Odisha'} - {companyInfo.pincode || '765001'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: 10 }}>
                      <div><strong>Tel:</strong> {companyInfo.mobile || '+91 94402 89999'}</div>
                      <div><strong>Email:</strong> {companyInfo.email || 'stay@saivasudevresidency.com'}</div>
                      <div><strong>Web:</strong> www.saivasudevresidency.com</div>
                      <div style={{ marginTop: 3, fontSize: 11, fontWeight: 900 }}>
                        PROPERTY GSTIN: <span style={{ letterSpacing: 0.5 }}>{companyInfo.gstNo || '21AEKPP8689J1ZS'}</span>
                      </div>
                      <div style={{ fontSize: 9, color: '#334155' }}>State Code: 21 (Odisha)</div>
                    </div>
                  </div>

                  {/* 2-Column Guest & Stay Particulars Grid matching Document 3 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 14, borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 8 }}>
                    {/* Left Column: Guest Particulars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>GUEST NAME:</strong> <span style={{ fontWeight: 800 }}>{currentCheckout.guestName.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>GUEST ADDRESS:</strong> <span>{currentCheckout.city?.toUpperCase() || 'RAYAGADA'}, {currentCheckout.state?.toUpperCase() || 'ODISHA'} - {currentCheckout.pinCode || '765001'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>NATIONALITY:</strong> <span>India</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>COMPANY NAME:</strong> <span>{(currentCheckout as any).companyName || '-'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>COMPANY ADDRESS:</strong> <span>{(currentCheckout as any).companyAddress || '-'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>COMPANY GSTIN:</strong> <span style={{ fontWeight: 700 }}>{(currentCheckout as any).gstNumber || '-'}</span>
                      </div>
                    </div>

                    {/* Right Column: Room & Invoice Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>BILL NUMBER:</strong> <span style={{ fontWeight: 900 }}>{currentCheckout.invoiceNo}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>REG. NO.:</strong> <span>{currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-4) || '3334'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>ROOM NO.:</strong> <span><strong>{currentCheckout.roomNo}</strong> &nbsp;&nbsp;&nbsp;&nbsp; <strong>PAX:</strong> 2</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>ROOM CATEGORY:</strong> <span>{currentCheckout.roomType.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>ROOM TARIFF:</strong> <span>₹{currentCheckout.perDayTariff.toFixed(2)} +Taxes</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>ARRIVAL DATE:</strong> <span>{currentCheckout.checkInDate} {currentCheckout.checkInTime}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>DEPARTURE DATE:</strong> <span>{currentCheckout.checkOutDate} {currentCheckout.checkOutTime}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>PLAN:</strong> <span>C P (Room with Breakfast)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr' }}>
                        <strong>BILLING INST.:</strong> <span>Direct Guest Settlement</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Column Ledger Grid matching Document 3 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '3px 4px', width: 75 }}>DATE</th>
                        <th style={{ textAlign: 'left', padding: '3px 4px', width: 70 }}>VOUCHER</th>
                        <th style={{ textAlign: 'left', padding: '3px 4px' }}>DESCRIPTION</th>
                        <th style={{ textAlign: 'center', padding: '3px 4px', width: 65 }}>SAC</th>
                        <th style={{ textAlign: 'right', padding: '3px 4px', width: 85 }}>DEBITS</th>
                        <th style={{ textAlign: 'right', padding: '3px 4px', width: 85 }}>CREDITS</th>
                        <th style={{ textAlign: 'right', padding: '3px 4px', width: 95 }}>BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dashed #cbd5e1' }}>
                          <td style={{ padding: '3px 4px' }}>{row.date}</td>
                          <td style={{ padding: '3px 4px', fontWeight: 700 }}>{row.voucher || ''}</td>
                          <td style={{ padding: '3px 4px' }}>{row.description}</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>{row.sac || ''}</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>
                            {row.debit > 0 ? row.debit.toFixed(2) : '0.00'}
                          </td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>
                            {row.credit > 0 ? row.credit.toFixed(2) : '0.00'}
                          </td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 600 }}>
                            {row.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {/* Day Total */}
                      <tr style={{ borderTop: '2px solid #000', fontWeight: 700 }}>
                        <td colSpan={4} style={{ textAlign: 'right', padding: '4px' }}>Day Total:</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>{totalDebits.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>{totalCredits.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>{netPayableAmt.toFixed(2)}</td>
                      </tr>
                      {/* Grand Total */}
                      <tr style={{ borderTop: '1px solid #000', borderBottom: '2px solid #000', fontWeight: 900 }}>
                        <td colSpan={4} style={{ textAlign: 'right', padding: '4px' }}>Grand Total:</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>{totalDebits.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>{totalCredits.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '4px', fontSize: 12 }}>{netPayableAmt.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Round Off, Net Amount & In Words line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #000', marginBottom: 6 }}>
                    <div>
                      <strong>In Words:</strong> {formatRupeesToWords(netPayableAmt)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontWeight: 900 }}>
                      <span>Round Off: 0.00</span>
                      <span style={{ fontSize: 12 }}>Net Amount: ₹{netPayableAmt.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Dual-Slab GST Tax Summary Box matching Document 3 */}
                  <div style={{ border: '1px solid #000', padding: 6, marginBottom: 8, background: '#fafafa' }}>
                    <div style={{ fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 4, letterSpacing: 0.5 }}>
                      TAX SUMMARY &amp; STATUTORY GST RECONCILIATION
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #000', fontWeight: 800 }}>
                          <th style={{ textAlign: 'left', padding: '2px 4px' }}>Tax Details</th>
                          <th style={{ textAlign: 'right', padding: '2px 4px', width: 140 }}>Taxable Amount (₹)</th>
                          <th style={{ textAlign: 'right', padding: '2px 4px', width: 140 }}>Tax Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '2px 4px' }}>Central GST @ 6.00% (Room Tariff - SAC 996311)</td>
                          <td style={{ textAlign: 'right', padding: '2px 4px' }}>{roomTariff.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: '2px 4px' }}>{roomCgst.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 4px' }}>State GST @ 6.00% (Room Tariff - SAC 996311)</td>
                          <td style={{ textAlign: 'right', padding: '2px 4px' }}>{roomTariff.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: '2px 4px' }}>{roomSgst.toFixed(2)}</td>
                        </tr>
                        {foodTotal > 0 && (
                          <>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>Central GST @ 2.50% (Vasudev Rasoi Food - SAC 996331)</td>
                              <td style={{ textAlign: 'right', padding: '2px 4px' }}>{foodTaxable.toFixed(2)}</td>
                              <td style={{ textAlign: 'right', padding: '2px 4px' }}>{foodCgst.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '2px 4px' }}>State GST @ 2.50% (Vasudev Rasoi Food - SAC 996331)</td>
                              <td style={{ textAlign: 'right', padding: '2px 4px' }}>{foodTaxable.toFixed(2)}</td>
                              <td style={{ textAlign: 'right', padding: '2px 4px' }}>{foodSgst.toFixed(2)}</td>
                            </tr>
                          </>
                        )}
                        <tr style={{ borderTop: '1px solid #000', fontWeight: 900 }}>
                          <td style={{ padding: '3px 4px' }}>Total Tax Collected:</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>
                            {(roomTariff + foodTaxable).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>
                            {totalTaxCollected.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Statutory Footer, Check-In/Out Rules & Signatures matching Document 3 */}
                  <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>CHECK-IN 12:00 NOON / CHECK-OUT TIME 10:00 AM</span>
                      <span>ORIGINAL FOR RECIPIENT</span>
                    </div>

                    <div style={{ textAlign: 'center', fontWeight: 800, marginTop: 4, textTransform: 'uppercase', color: '#0f172a' }}>
                      The registration certificate is required to be prominently displayed at all places of business in the State
                    </div>

                    <div style={{ textAlign: 'center', fontSize: 9, color: '#334155', marginTop: 2 }}>
                      SRI SAI VASUDEV RESIDENCY &bull; PROPRIETOR: PAIDISETTY MANMADHA RAO &bull; GSTIN: 21AEKPP8689J1ZS
                      <br />
                      SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001
                    </div>

                    {/* Dual Signature Blocks */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingTop: 6 }}>
                      <div style={{ textAlign: 'center', width: 200, borderTop: '1px dashed #000', paddingTop: 4 }}>
                        <strong>GUEST SIGNATURE</strong>
                      </div>
                      <div style={{ textAlign: 'center', width: 250, borderTop: '1px dashed #000', paddingTop: 4 }}>
                        <strong>CASHIER / AUTHORIZED SIGNATORY</strong>
                        <div style={{ fontSize: 9, color: '#64748b' }}>For SRI SAI VASUDEV RESIDENCY</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================================= */}
            {/* FORMAT 6: RESTAURANT DINE-IN BILL WITH ROOM FOLIO TRANSFER (DOCUMENT 1)   */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_6_Restaurant_DineIn' && (
              <div
                style={{
                  background: '#ffffff',
                  padding: 24,
                  fontSize: 12,
                  color: '#0f172a',
                  fontFamily: "'Courier New', Courier, monospace"
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.5 }}>VASUDEV RASOI</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>FINE DINE &bull; PURE VEGETARIAN &amp; MULTI-CUISINE</div>
                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                      FSSAI LIC NO: 12017026000083
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                      {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                    </div>
                    <div style={{ fontSize: 10.5 }}>
                      {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY'}
                    </div>
                    <div style={{ fontSize: 10.5 }}>
                      Rayagada, Odisha - 765001 &bull; Ph: 06856-222001
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 700 }}>
                      GSTIN: {companyInfo.gstNo || '21AEKPP8689J1ZS'}
                    </div>
                  </div>
                </div>

                {/* Metadata Strip */}
                <div style={{
                  border: '1px solid #000',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 1fr 1.1fr',
                  fontSize: 11,
                  padding: '4px 8px',
                  marginBottom: 12,
                  background: '#f8fafc'
                }}>
                  <div><strong>STEWARD:</strong> Dilip</div>
                  <div><strong>TABLE NO:</strong> 28</div>
                  <div><strong>COVERS:</strong> 2</div>
                  <div><strong>TIME:</strong> 18:29</div>
                  <div><strong>DATE:</strong> 08/05/26</div>
                  <div><strong>BILL NO:</strong> 1032</div>
                </div>

                {/* 2-Column Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
                  {/* Left Room Transfer Box */}
                  <div style={{
                    border: '1.5px solid #000',
                    borderRadius: 4,
                    padding: '8px 10px',
                    fontSize: 10,
                    lineHeight: 1.45,
                    background: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4, fontWeight: 900 }}>
                      <span>ROOM NO:</span>
                      <span style={{ fontSize: 12, background: '#f1f5f9', padding: '0 6px', border: '1px solid #94a3b8' }}>
                        28 (# 368)
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, textAlign: 'center', margin: '4px 0', fontSize: 9, color: '#dc2626' }}>
                      DO NOT SIGN IF PAID CASH
                    </div>

                    <div style={{ margin: '8px 0 4px', borderBottom: '1px solid #000', paddingBottom: 2 }}>
                      <strong>GUEST SIGNATURE:</strong>
                      <div style={{ fontStyle: 'italic', fontFamily: 'cursive', color: '#1e40af', fontSize: 12, marginTop: 4 }}>
                        {currentCheckout.guestName || 'A. V. Kartik'}
                      </div>
                    </div>

                    <div style={{ marginTop: 6, fontSize: 9.5 }}>
                      <div><strong>NAME:</strong> {currentCheckout.guestName}</div>
                      <div><strong>COMPANY:</strong> _________________</div>
                      <div><strong>GSTIN:</strong> ___________________</div>
                      <div><strong>ADDRESS:</strong> Rayagada, Odisha</div>
                    </div>

                    <div style={{ borderTop: '1px solid #000', marginTop: 6, paddingTop: 4, fontSize: 8.5 }}>
                      UNCONSUMED FOOD AND DRINKS NOT TO BE TAKEN AWAY
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 8.5, marginTop: 2 }}>
                      &bull; ALL DISPUTES ARE SUBJECT TO RAYAGADA JURISDICTION
                    </div>
                    <div style={{ fontSize: 8.5, color: '#475569', marginTop: 2 }}>
                      FSSAI LIC NO: 12017026000083
                    </div>
                    <div style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2 }}>
                      (A UNIT OF {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'})
                    </div>
                  </div>

                  {/* Right Items & Taxes */}
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
                      <thead>
                        <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'left' }}>
                          <th style={{ padding: '4px' }}>DESCRIPTION</th>
                          <th style={{ padding: '4px', textAlign: 'center', width: 65 }}>HSN/SAC</th>
                          <th style={{ padding: '4px', textAlign: 'center', width: 40 }}>QTY.</th>
                          <th style={{ padding: '4px', textAlign: 'right', width: 60 }}>RATE</th>
                          <th style={{ padding: '4px', textAlign: 'right', width: 70 }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px dotted #cbd5e1' }}>
                          <td style={{ padding: '3px 4px', fontWeight: 700 }}>ROTI PLAIN</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>996332</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>2</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>60.00</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>120.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px dotted #cbd5e1' }}>
                          <td style={{ padding: '3px 4px', fontWeight: 700 }}>KULCHA MASALA</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>996332</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>3</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>110.00</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>330.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px dotted #cbd5e1' }}>
                          <td style={{ padding: '3px 4px', fontWeight: 700 }}>ROTI BUTTER</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>996332</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>60.00</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>60.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px dotted #cbd5e1' }}>
                          <td style={{ padding: '3px 4px', fontWeight: 700 }}>WATER HIMALAYA</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>996334</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>110.00</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>110.00</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Financial Summary */}
                    <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Amount:</span>
                        <strong>620.00</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                        <span>Discount:</span>
                        <span>-102.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>State GST 9.00 %:</span>
                        <span>46.62</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Central GST 9.00 %:</span>
                        <span>46.62</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1.5px solid #000',
                        borderBottom: '1.5px solid #000',
                        padding: '4px 0',
                        marginTop: 4,
                        fontSize: 13,
                        fontWeight: 900
                      }}>
                        <span>Net Amount:</span>
                        <span>₹611.00</span>
                      </div>
                      <div style={{ fontSize: 9.5, fontStyle: 'italic', marginTop: 3 }}>
                        (Rupees Six Hundred Eleven Only)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Notice */}
                <div style={{ borderTop: '1px dashed #000', marginTop: 12, paddingTop: 6, textAlign: 'center', fontSize: 9 }}>
                  &quot;The registration certificate is required to be prominently displayed at all places of business in the State&quot;
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FORMAT 7: IN-ROOM DINING / ROOM SERVICE BILL (DOCUMENT 2)                 */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_7_RoomService' && (
              <div
                style={{
                  background: '#ffffff',
                  padding: 24,
                  fontSize: 12,
                  color: '#0f172a',
                  fontFamily: "'Courier New', Courier, monospace"
                }}
              >
                {/* Header */}
                <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                    {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                  </div>
                  <div style={{ fontSize: 10.5 }}>
                    {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001'}
                  </div>
                  <div style={{ fontSize: 10.5 }}>
                    Ph: 06856-222001 &bull; GSTIN: {companyInfo.gstNo || '21AEKPP8689J1ZS'}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    border: '1.5px solid #000',
                    padding: '2px 18px',
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    marginTop: 6,
                    background: '#f8fafc'
                  }}>
                    ROOM SERVICE
                  </div>
                </div>

                {/* Metadata Strip */}
                <div style={{
                  border: '1px solid #000',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 1fr 1.1fr',
                  fontSize: 11,
                  padding: '4px 8px',
                  marginBottom: 12,
                  background: '#f8fafc'
                }}>
                  <div><strong>STEWARD:</strong> Ranjan</div>
                  <div><strong>TABLE/ROOM:</strong> {currentCheckout.roomNo || '368'}</div>
                  <div><strong>COVERS:</strong> 2</div>
                  <div><strong>TIME:</strong> 11:29</div>
                  <div><strong>DATE:</strong> 08/05/26</div>
                  <div><strong>BILL NO:</strong> 1059</div>
                </div>

                {/* 2-Column Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
                  {/* Left Room Transfer Box */}
                  <div style={{
                    border: '1.5px solid #000',
                    borderRadius: 4,
                    padding: '8px 10px',
                    fontSize: 10,
                    lineHeight: 1.45,
                    background: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4, fontWeight: 900 }}>
                      <span>ROOM NO:</span>
                      <span style={{ fontSize: 13, background: '#f1f5f9', padding: '0 8px', border: '1px solid #94a3b8' }}>
                        {currentCheckout.roomNo || '368'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, textAlign: 'center', margin: '4px 0', fontSize: 9, color: '#dc2626' }}>
                      DO NOT SIGN IF PAID CASH
                    </div>

                    <div style={{ margin: '8px 0 4px', borderBottom: '1px solid #000', paddingBottom: 2 }}>
                      <strong>GUEST SIGNATURE:</strong>
                      <div style={{ fontStyle: 'italic', fontFamily: 'cursive', color: '#1e40af', fontSize: 12, marginTop: 4 }}>
                        {currentCheckout.guestName || 'A. V. Kartik'}
                      </div>
                    </div>

                    <div style={{ marginTop: 6, fontSize: 9.5 }}>
                      <div><strong>GUEST:</strong> {currentCheckout.guestName}</div>
                      <div><strong>MOBILE:</strong> {currentCheckout.guestPhone}</div>
                    </div>

                    <div style={{ borderTop: '1px solid #000', marginTop: 8, paddingTop: 4, fontSize: 8.5 }}>
                      UNCONSUMED FOOD AND DRINKS NOT TO BE TAKEN AWAY
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 8.5, marginTop: 2 }}>
                      &bull; ALL DISPUTES ARE SUBJECT TO RAYAGADA JURISDICTION
                    </div>
                    <div style={{ fontSize: 8.5, color: '#475569', marginTop: 2 }}>
                      FSSAI LIC NO: 12017026000083
                    </div>
                    <div style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2 }}>
                      (A UNIT OF {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'})
                    </div>
                  </div>

                  {/* Right Items & Taxes */}
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
                      <thead>
                        <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'left' }}>
                          <th style={{ padding: '4px' }}>DESCRIPTION</th>
                          <th style={{ padding: '4px', textAlign: 'center', width: 65 }}>HSN/SAC</th>
                          <th style={{ padding: '4px', textAlign: 'center', width: 40 }}>QTY.</th>
                          <th style={{ padding: '4px', textAlign: 'right', width: 60 }}>RATE</th>
                          <th style={{ padding: '4px', textAlign: 'right', width: 70 }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px dotted #cbd5e1' }}>
                          <td style={{ padding: '3px 4px', fontWeight: 700 }}>TEA / COFFEE</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>996332</td>
                          <td style={{ padding: '3px 4px', textAlign: 'center' }}>1</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right' }}>120.00</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>120.00</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Amount:</span>
                        <strong>120.00</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>State GST 9.00 %:</span>
                        <span>10.80</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Central GST 9.00 %:</span>
                        <span>10.80</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1.5px solid #000',
                        borderBottom: '1.5px solid #000',
                        padding: '4px 0',
                        marginTop: 4,
                        fontSize: 13,
                        fontWeight: 900
                      }}>
                        <span>Net Amount:</span>
                        <span>₹142.00</span>
                      </div>
                      <div style={{ fontSize: 9.5, fontStyle: 'italic', marginTop: 3 }}>
                        (Rupees One Hundred Forty Two Only)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Notice */}
                <div style={{ borderTop: '1px dashed #000', marginTop: 12, paddingTop: 6, textAlign: 'center', fontSize: 9 }}>
                  &quot;The registration certificate is required to be prominently displayed at all places of business in the State&quot;
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FORMAT 8: EDC / POS CARD MACHINE SETTLEMENT THERMAL SLIP (DOCUMENT 4)     */}
            {/* ========================================================================= */}
            {activeFormat === 'Format_8_Card_EDC_Slip' && (
              <div
                style={{
                  background: '#ffffff',
                  padding: '24px 16px',
                  maxWidth: 360,
                  margin: '0 auto',
                  fontSize: 11,
                  lineHeight: 1.45,
                  fontFamily: "'Courier New', Courier, monospace",
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}
              >
                {/* Bank & Merchant Header */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}>
                    [■] HDFC BANK
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>
                    {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                  </div>
                  <div style={{ fontSize: 9.5 }}>
                    {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY'}
                  </div>
                  <div style={{ fontSize: 9.5 }}>
                    RAYAGADA, ODISHA 765001
                  </div>
                </div>

                {/* Terminal Metadata Grid */}
                <div style={{ fontSize: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DATE: {currentCheckout.checkOutDate}</span>
                    <span>TIME: {currentCheckout.checkOutTime || '10:00:21'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MID: E31758</span>
                    <span>TID: 67005863</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Batch No: 001163</span>
                    <span>Invoice: 008106</span>
                  </div>
                </div>

                {/* Status Box */}
                <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '6px 0' }}>
                  <div style={{ fontWeight: 900, fontSize: 12 }}>Transaction Approved</div>
                  <div style={{ fontWeight: 800, fontSize: 11 }}>Sale</div>
                </div>

                {/* Card Security Parameters */}
                <div style={{ fontSize: 9.5, lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Card No:</span>
                    <strong>XXXXXXXXXXXX8884</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Card Entry Mode:</span>
                    <span>CHIP</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Card Type:</span>
                    <span>VISA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Exp Date:</span>
                    <span>**/**</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>App Label:</span>
                    <span>VISA CREDIT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>AID:</span>
                    <span>A0000000031010</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>APPR CODE:</span>
                    <strong>029844</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>RRN:</span>
                    <span>000000008164</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TXN ID:</span>
                    <span>6109548993</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TVR: 0080048000</span>
                    <span>TSI: E800</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TC:</span>
                    <span>5C76CD64387ECA31</span>
                  </div>
                </div>

                {/* Net Sale Amount Banner */}
                <div style={{
                  borderTop: '2px solid #000',
                  borderBottom: '2px solid #000',
                  padding: '6px 0',
                  margin: '8px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13,
                  fontWeight: 900
                }}>
                  <span>SALE AMT:</span>
                  <span>INR {currentCheckout.netPayable.toFixed(2)}</span>
                </div>

                {/* Cardholder Verification & Agreement */}
                <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 10 }}>
                  <div style={{ fontWeight: 900 }}>PIN VERIFIED OK</div>
                  <div style={{ fontSize: 9 }}>SIGNATURE NOT REQUIRED</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 6, borderTop: '1px dashed #000', paddingTop: 6, fontSize: 9 }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{(currentCheckout.guestName || 'AMMU VENKATA KARTIK').toUpperCase()}</div>
                  <div style={{ fontStyle: 'italic', fontSize: 8.5, color: '#334155' }}>
                    I AGREE TO PAY AS PER THE CARD ISSUER AGREEMENT
                  </div>
                  <div style={{ fontWeight: 900, marginTop: 4, letterSpacing: 1 }}>CUSTOMER COPY</div>
                  <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                    Version 2.1.107.259 &bull; Powered by Mosambee
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Button Bar Matching Video 26 Frame 0180 */}
        <footer
          style={{
            background: '#ffffff',
            padding: '10px 18px',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}
        >
          {/* [Print] Button - Charcoal / Black #1e293b */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              padding: '8px 22px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>

          {/* [Format 2] Button - Blue #2563eb */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_2_Summary')}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 2
          </button>

          {/* [Format 3] Button - Green #16a34a */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_3_A4_Standard')}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 3
          </button>

          {/* [Format 4(A5)] Button - Yellow #ca8a04 / #eab308 */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_4_A5_Compact')}
            style={{
              background: '#ca8a04',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 4(A5)
          </button>

          {/* [Format 5] Enterprise Folio (Doc 3) */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_5_Enterprise_Folio')}
            style={{
              background: '#4338ca',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 5 (Doc 3)
          </button>

          {/* [Format 6] Dine-In Bill (Doc 1) */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_6_Restaurant_DineIn')}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 6 (Doc 1)
          </button>

          {/* [Format 7] Room Service Bill (Doc 2) */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_7_RoomService')}
            style={{
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 7 (Doc 2)
          </button>

          {/* [Format 8] Card EDC Slip (Doc 4) */}
          <button
            type="button"
            onClick={() => setActiveFormat('Format_8_Card_EDC_Slip')}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 8 (Doc 4)
          </button>

          {/* WhatsApp Bill Dispatch */}
          <button
            type="button"
            onClick={handleWhatsAppSend}
            style={{
              background: '#25d366',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Dispatch official PDF Tax Invoice link directly to guest on WhatsApp"
          >
            <span>💬</span>
            <span>WhatsApp Bill</span>
          </button>
        </footer>

        {/* Native Chrome Print Dialog Simulation Modal (Video 26 Frames 0135, 0170, 0195, 0215) */}
        {showPrintDialogOverlay && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowPrintDialogOverlay(false)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 8,
                width: 480,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                padding: 24,
                color: '#1e293b'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Print Settings ({activeFormat})</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>2 sheets of paper</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#475569' }}>
                    Destination
                  </label>
                  <select
                    value={printDestination}
                    onChange={e => setPrintDestination(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                  >
                    <option value="Canon LBP2900">Canon LBP2900 (Front Desk Laser)</option>
                    <option value="HP LaserJet Pro">HP LaserJet Pro M404n</option>
                    <option value="Save as PDF">Save as PDF</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#475569' }}>
                      Paper Size
                    </label>
                    <select
                      value={paperSize}
                      onChange={e => setPaperSize(e.target.value as any)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                    >
                      <option value="A4">A4 (Standard 210 x 297 mm)</option>
                      <option value="A5">A5 (Half Sheet 148 x 210 mm)</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, color: '#475569' }}>
                      Margins
                    </label>
                    <select
                      value={margins}
                      onChange={e => setMargins(e.target.value as any)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                    >
                      <option value="None">None (Standard Header)</option>
                      <option value="Default">Default</option>
                      <option value="Minimum">Minimum</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11, color: '#475569' }}>
                  💡 <strong>Printing Pro-Tip:</strong> Set <em>Margins: None</em> and <em>Paper Size: {activeFormat === 'Format_4_A5_Compact' ? 'A5' : 'A4'}</em> in print dialog to perfectly fit the bill without page overflow.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowPrintDialogOverlay(false)}
                  style={{ background: '#e2e8f0', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrint}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}
                >
                  Print Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

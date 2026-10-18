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

  const currentCheckout: PmsCheckOutDetail =
    checkouts.find(c => c.invoiceNo === selectedInvoiceNo) ||
    checkouts[0] || {
      invoiceNo: 'GSR/252/24-25',
      roomNo: '105',
      roomType: 'DELUXE',
      guestName: 'SIDDHANT JI',
      guestPhone: '9466219194',
      checkInDate: '01-07-25',
      checkInTime: '06:32 PM',
      checkOutDate: '15-07-25',
      checkOutTime: '01:15 PM',
      calculationType: '12hour',
      numberOfDays: 15,
      perDayTariff: 3000,
      totalRoomRent: 45000,
      foodAmount: 32,
      gstPercent: 12,
      gstAmount: 5400,
      cgstAmount: 2700,
      sgstAmount: 2700,
      addOthers: 0,
      lessDiscount: 0,
      advanceDeducted: 0,
      billAmount: 50432,
      netPayable: 50432,
      paymentMode: 'Online',
      payments: [{ mode: 'Online', amount: 50432, referenceNo: 'UPI/9466219194', remark: 'PhonePe QR Payment' }],
      checkoutRemark: '15 Days Stay with Breakfast package. Key deposited at reception.',
      city: 'Etawah',
      state: 'Uttar Pradesh',
      country: 'India',
      pinCode: '206001',
      sacCode: '996311',
      invoiceFormat: 'A4_Standard'
    };

  // Generate day-wise breakdown rows for Format 1 (Frame 0115)
  const generateStayDates = (startDateStr: string, totalDays: number): string[] => {
    const dates: string[] = [];
    const parts = startDateStr.split('-');
    let startDay = parseInt(parts[0], 10) || 1;
    const month = parts[1] || '07';
    const year = parts[2] || '25';

    for (let i = 0; i < totalDays; i++) {
      const d = startDay + i;
      dates.push(`${d < 10 ? '0' + d : d}-${month}-${year}`);
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

  const getRouteLabel = () => {
    switch (activeFormat) {
      case 'Format_1_DayWise':
        return `demo.datahouseerp.com/room_checkout_view2/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '252'}`;
      case 'Format_2_Summary':
        return `demo.datahouseerp.com/room_checkout_view/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '238'}`;
      case 'Format_3_A4_Standard':
        return `demo.datahouseerp.com/room_checkout_view3/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '238'}`;
      case 'Format_4_A5_Compact':
        return `demo.datahouseerp.com/room_checkout_view4/${currentCheckout.invoiceNo.replace(/[^0-9]/g, '').slice(-3) || '238'}`;
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
                      {companyInfo.firmName || 'HALL OF KNOTS'}
                    </h1>
                    <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>
                      {companyInfo.address1 || 'Mall Godown Rd, near Choudhary petrol pump'},{' '}
                      {companyInfo.address2 || 'Ashok Nagar, Chogurjee Nagar'}, {companyInfo.city || 'Etawah'},{' '}
                      {companyInfo.state || 'UTTAR PRADESH'} {companyInfo.pincode || '206001'}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      India Email: {companyInfo.email || '-'} Phone Mobile {companyInfo.mobile || '9466219194'}
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
                      <div><strong>Bank Branch:</strong> {companyInfo.bankBranch || 'MAIN BRANCH SHIRDI'}</div>
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
                        For {companyInfo.firmName || 'HALL OF KNOTS'}
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
                    {companyInfo.firmName || 'HALL OF KNOTS'}
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
                      <div style={{ fontSize: 10, fontWeight: 800 }}>For {companyInfo.firmName || 'HALL OF KNOTS'}</div>
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
                    {companyInfo.firmName || 'HOTEL SAI VASUDEV RESIDENCY'}
                  </h1>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    {companyInfo.address1}, {companyInfo.city} - {companyInfo.pincode} ({companyInfo.state})
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                    Phone Mobile {companyInfo.mobile} website {companyInfo.website} India Email: {companyInfo.email}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                    GSTIN: {companyInfo.gstNo} &bull; STATE CODE: {companyInfo.companyGstCode || '27'}
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
              padding: '8px 20px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Format 4(A5)
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
                      <option value="None">None (Video 26 recommended)</option>
                      <option value="Default">Default</option>
                      <option value="Minimum">Minimum</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11, color: '#475569' }}>
                  💡 <strong>Video 26 Pro-Tip:</strong> Set <em>Margins: None</em> and <em>Paper Size: {activeFormat === 'Format_4_A5_Compact' ? 'A5' : 'A4'}</em> in print dialog to perfectly fit the bill without page overflow.
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

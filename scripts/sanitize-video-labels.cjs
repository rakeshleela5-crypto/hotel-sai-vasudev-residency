/**
 * Scripts to sanitize all developer/training artifacts (Video XX, Frame XXXX, RoomG defaults)
 * from user-facing UI labels, tooltips, options, and headers across Hotel Sai Vasudev Residency ERP.
 */
const fs = require('fs');
const path = require('path');

// 1. HOTEL PMS MODAL
function sanitizeHotelPmsModal() {
  const filePath = 'src/components/pms/HotelPmsModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    ['⛔ ACCESS DENIED (Video 23 Anti-Theft Boundary)', '⛔ ACCESS DENIED (Security Boundary Active)'],
    ['title="Click to view and confirm pending online guest bookings (Video 20 Frame 0360)"', 'title="Click to view and confirm pending online guest bookings"'],
    ['title="Click to switch property / branch (Video 21 Multi-Location)"', 'title="Click to switch property / branch (Multi-Property Network)"'],
    ['title="Click to test PMS on mobile / tablet responsive emulator (Video 21 Frame 0138)"', 'title="Click to test PMS on mobile / tablet responsive emulator"'],
    ['title="Click to manage WhatsApp SMS Gateway & Message Templates (Video 22)"', 'title="Click to manage WhatsApp SMS Gateway & Message Templates"'],
    ['title="Click to view 30-Dimension Online vs Offline Matrix & Disaster Recovery Tools (Video 25)"', 'title="Click to view Cloud vs Offline Architecture Matrix & Disaster Recovery Tools"'],
    ['title="Click to explore all 20 Master Features of RoomG PMS (Video 27)"', 'title="Click to explore all 20 Master Enterprise Features of Hotel ERP"'],
    ['title="Click to view Room & Food GST Reports, B2B, B2C and Report Hub (Video 28)"', 'title="Click to view Room & Food GST Reports, B2B, B2C and Report Hub"'],
    ['title="Click to access Video Tutorials, Support Tickets, Remote Support & User Manual (Video 30)"', 'title="Click to access System Guides, Support Tickets, Remote Support & User Manual"'],
    ['title="Click to manage MR & Salesman Commissions, Agent Master, and Top 15 PMS Features (Video 31)"', 'title="Click to manage Agent & Referral Commissions, Directory & Key Features"'],
    ['title="Click to manage Liquor & Bar Inventory, Peg Billing, VAT 13% + SUR 10%, and ML Stock (Video 32)"', 'title="Click to manage Bar & Beverage Inventory, Peg Billing, VAT 13% + SUR 10%, and ML Stock"'],
    ['title="Click to configure No-Discount Items, Price Integrity, and Exemption Rules (Video 33)"', 'title="Click to configure No-Discount Items, Price Integrity, and Exemption Rules"'],
    ['title="Click to view Store Wise Stock, Consolidated Inventories, Simulator & Linen Control (Video 34)"', 'title="Click to view Store Wise Stock, Consolidated Inventories, Simulator & Linen Control"'],
    ['title="Click to manage Banquet Halls, Marriage Gardens, Event Catering, Multi-Room Linking & Tax Invoices (Video 35)"', 'title="Click to manage Banquet Halls, Event Catering, Multi-Room Linking & Tax Invoices"'],
    ['⚡ Quick Switch Staff (Video 23)', '⚡ Quick Switch Staff'],
    ['🔄 Room Shifting (Video 11)', '🔄 Room Shifting'],
    ['📋 Room KOT Register (Video 14)', '📋 Room KOT Register'],
    ['🍳 Kitchen Dashboard (KDS - Video 12)', '🍳 Kitchen Order Dashboard (KDS)'],
    ['🏬 Restaurant Table Matrix (Video 13)', '🏬 Restaurant Table Matrix'],
    ['🔁 Shift Table (Video 13)', '🔁 Shift Table'],
    ['🍽️ NC KOT Register (Video 13)', '🍽️ NC KOT Register'],
    ['📄 Receipt Register (Video 15)', '📄 Receipt Register'],
    ['💳 Payment Register (Video 16)', '💳 Payment Register'],
    ['🛒 Purchase Entry (Video 19)', '🛒 Purchase Entry'],
    ['🔁 Stock Transfer &amp; Issue (Video 19)', '🔁 Stock Transfer &amp; Issue'],
    ['🧾 Bill Formats &amp; Design (Video 26)', '🧾 Bill Formats &amp; Design'],
    ['💰 Outstanding Receivables (Video 15)', '💰 Outstanding Receivables'],
    ['📦 Store Wise Stock Report (Video 19)', '📦 Store Wise Stock Report'],
    ['👮 Police Station Report (Video 24)', '👮 Police Station Report'],
    ['🌅 Day End Report (Night Audit - Video 29)', '🌅 Day End Report (Night Audit)'],
    ['📊 Item Wise Sales Report (Video 29)', '📊 Item Wise Sales Report'],
    ['🏷️ Item Wise Stock Ledger (Video 29)', '🏷️ Item Wise Stock Ledger'],
    ['📖 Guest Log VIP Register (Video 29)', '📖 Guest Log VIP Register'],
    ['🤝 Shift Handover Report (Video 29)', '🤝 Shift Handover Report'],
    ['💳 Outstanding Payables (Creditors - Video 29)', '💳 Outstanding Payables (Creditors)'],
    ['🤝 MR &amp; Salesman Commission Ledger (Video 31)', '🤝 Agent &amp; Commission Ledger'],
    ['🏆 Top 15 PMS Features Hub (Video 31)', '🏆 Key PMS Features Hub'],
    ['🍷 Brand-Wise Liquor Stock &amp; Bar POS (Video 32)', '🍷 Bar &amp; Beverage POS'],
    ['🛡️ No-Discount Items &amp; Margin Rules (Video 33)', '🛡️ No-Discount Items &amp; Margin Rules'],
    ['🏬 Store-Wise Stock &amp; Inventory Suite (Video 34)', '🏬 Store-Wise Stock &amp; Inventory Suite'],
    ['📱 Multi-Device Simulator (Video 21)', '📱 Multi-Device Simulator'],
    ['🌐 Online vs Offline Architecture &amp; Backup (Video 25)', '🌐 Cloud Sync &amp; Offline Continuity'],
    ['titleOverride="Room KOT Register (Video 14 Frame 0260)"', 'titleOverride="Room KOT Register"']
  ];

  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized HotelPmsModal.tsx');
}

// 2. PMS HOME DASHBOARD MODAL
function sanitizePmsHomeDashboardModal() {
  const filePath = 'src/components/pms/PmsHomeDashboardModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    ['⛔ Access Denied (Video 23 Anti-Theft Boundary)', '⛔ Access Denied (Security Boundary Guard)'],
    ['Top 20 Features of RoomG PMS | Best Hotel Software in India', 'Top 20 Enterprise Features | Hotel Sai Vasudev Residency ERP'],
    ['title="Video 19: Purchase Inward to Godown (/purchases/create)"', 'title="Purchase Inward to Godown (/purchases/create)"'],
    ['title="Video 19: Stock Transfer (Main Store -> Kitchen)"', 'title="Stock Transfer (Main Store -> Kitchen)"'],
    ['title="Video 19: Stock Issue & Consumption (Kitchen -> Consume)"', 'title="Stock Issue & Consumption (Kitchen -> Consume)"'],
    ['title="Video 19: Store Wise Stock Report (/store_wise_stock)"', 'title="Store Wise Stock Report (/store_wise_stock)"'],
    ['title="Video 20: Online Public Guest Booking Engine (/hotel_room/DEMO0004)"', 'title="Online Public Guest Booking Engine (/hotel_room/DEMO0004)"'],
    ['title="Video 20: Unconfirmed Booking Register (/pending_booking)"', 'title="Unconfirmed Booking Register (/pending_booking)"'],
    ['title="Video 21 & 23: Staff Accounts & Duty Roster (/users)"', 'title="Staff Accounts & Duty Roster (/users)"'],
    ['title="Video 21 & 23: Roles & 72 Granular Permissions Matrix (/roles)"', 'title="Roles & 72 Granular Permissions Matrix (/roles)"'],
    ['title="Video 21: Multi-Location Chain Hotels Switcher (/multilocation)"', 'title="Multi-Location Chain Properties Switcher (/multilocation)"'],
    ['title="Video 21: Mobile Responsive Device Simulator (Frame 0138)"', 'title="Mobile Responsive Device Simulator"'],
    ['title="Video 22: Automated WhatsApp SMS Settings & Templates (/whatsapp_sms)"', 'title="Automated WhatsApp SMS Settings & Templates (/whatsapp_sms)"'],
    ['title="Video 22: WhatsApp Message Outbox & Fraud Audit Logs (/whatsapp_logs)"', 'title="WhatsApp Message Outbox & Audit Logs (/whatsapp_logs)"'],
    ['title="Video 24: Police Station Front Office Arrival & Departure Register (/police_station_report)"', 'title="Police Station Front Office Arrival & Departure Register (/police_station_report)"'],
    ['title="Video 25: Online vs Offline Architecture Comparison, Evaluator & Disaster Recovery Tools"', 'title="Cloud vs Offline Architecture Comparison & Disaster Recovery Tools"'],
    ['title="Video 26: Multi-Format Hotel Invoice Viewer (A4 Standard, Day-wise, Summary & A5 Compact)"', 'title="Multi-Format Hotel Invoice Viewer (A4 Standard, Day-wise, Summary & A5 Compact)"'],
    ['title="Video 26: Hotel Room Check Out Register Table (/roomcheckouts)"', 'title="Hotel Room Check Out Register Table (/roomcheckouts)"'],
    ['title="Video 26: Company Logo, UPI QR Code, Seal, and Signature Settings (/comp_pic_form)"', 'title="Company Logo, UPI QR Code, Seal, and Signature Settings (/comp_pic_form)"'],
    ['title="Video 27: Top 20 Features of RoomG PMS & Commercial Pricing Suite"', 'title="Top 20 Enterprise Features & Master System Specifications"'],
    ['title="Video 28: Room & Food Bill GST Report (23-Column Tax Audit Sheet)"', 'title="Room & Food Bill GST Report (23-Column Tax Audit Sheet)"'],
    ['title="Video 28: B2B Register (Only GST Customer Invoices - GSTR-1 Table 4)"', 'title="B2B Register (Only GST Customer Invoices - GSTR-1 Table 4)"'],
    ['title="Video 28: B2C Register (Without GST Invoices - GSTR-1 Table 7)"', 'title="B2C Register (Without GST Invoices - GSTR-1 Table 7)"'],
    ['title="Video 28: Master Report Dashboard (/report_dashboard - All 28 Reports)"', 'title="Master Report Dashboard (/report_dashboard - All 28 Reports)"'],
    ['title="Video 30: RoomG Video Tutorials & Training Hub (/helps)"', 'title="System Guides & Training Hub (/helps)"'],
    ['title="Video 30: Remote Desktop Assistance with UltraViewer & AnyDesk"', 'title="Remote Desktop Assistance with UltraViewer & AnyDesk"'],
    ['title="Video 30: Raise Support Ticket for Hansin IT Engineers"', 'title="Raise Support Ticket for IT Engineers"'],
    ['title="Video 31: MR & Salesman Wise Commission Tracking, Agent Directory & Payout Vouchers (/agent_commission)"', 'title="Agent & Referral Commission Tracking, Directory & Payout Vouchers (/agent_commission)"'],
    ['title="Video 31: Top 15 PMS Features Official Canonical Architecture & 1-Click Launch Hub"', 'title="Key Enterprise Features Architecture & 1-Click Launch Hub"'],
    ['title="Video 32: Liquor & Bar POS, Peg Billing, VAT 13% + SUR 10%, ML Inventory & Stock (/liqour_stock_brand_wise)"', 'title="Bar & Beverage POS, Peg Billing, VAT 13% + SUR 10%, ML Inventory & Stock (/liqour_stock_brand_wise)"'],
    ['title="Video 32: Brand-Wise Liquid Stock Ledger in ML and Bottle Equivalents"', 'title="Brand-Wise Beverage Stock Ledger in ML and Bottle Equivalents"'],
    ['title="Video 33: No-Discount Items, Price Integrity, Exemption Groups & Live Bill Margin Protection (/no_discount_master)"', 'title="No-Discount Items, Price Integrity, Exemption Groups & Live Bill Margin Protection (/no_discount_master)"'],
    ['title="Video 33: Live Bill Discount Simulator & Profit Margin Auditor (Frame 0180)"', 'title="Live Bill Discount Simulator & Profit Margin Auditor"'],
    ['title="Video 34: Store-Wise Stock Report, Multi-Godown Balance & Inventory (/store_wise_stock)"', 'title="Store-Wise Stock Report, Multi-Godown Balance & Inventory (/store_wise_stock)"'],
    ['title="Video 34: Consolidated Hotel Inventory & Linen Anti-Theft Ledger (/inventories)"', 'title="Consolidated Hotel Inventory & Linen Asset Ledger (/inventories)"'],
    ['title="Video 35: Banquet Hall Billing, Marriage Garden Booking & Event Tax Invoice Demo (/roombookings/create)"', 'title="Banquet Hall Billing, Function Hall Booking & Event Tax Invoice (/roombookings/create)"'],
    ['title="Video 35: Banquet Tax Invoices, Frame 0700 GST Breakdown & BEO Schedules"', 'title="Banquet Tax Invoices, GST Breakdown & BEO Schedules"'],
    ['title="Click to view and print pending Room KOTs (Video 14)"', 'title="Click to view and print pending Room KOTs"'],
    ['title="Click to view and print pending Restaurant Table KOTs (Video 14)"', 'title="Click to view and print pending Restaurant Table KOTs"'],
    ['title="Click to review and confirm online guest room bookings (Video 20 Frame 0360)"', 'title="Click to review and confirm online guest room bookings"'],
    ['titleOverride="Room KOT Register (Video 14 Frame 0260)"', 'titleOverride="Room KOT Register"']
  ];

  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized PmsHomeDashboardModal.tsx');
}

// 3. HOTEL BILL FORMAT MODAL
function sanitizeHotelBillFormatModal() {
  const filePath = 'src/components/pms/HotelBillFormatModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/None \(Video 26 recommended\)/g, 'None (Standard Header)');
  content = content.replace(/Video 26 Multi-Format Engine/g, 'Multi-Format Billing Engine');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized HotelBillFormatModal.tsx');
}

// 4. NEW ROOM CHECK IN MODAL
function sanitizeNewRoomCheckInModal() {
  const filePath = 'src/components/pms/NewRoomCheckInModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Agent \/ MR \(Video 31\)/g, 'Booking Agent / Referral');
  content = content.replace(/to prevent backdating fraud \(Video 23\)/g, 'as per front-desk security policy');
  content = content.replace(/locked for staff \(Video 23\)/g, 'locked as per management policy');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized NewRoomCheckInModal.tsx');
}

// 5. USER MANAGEMENT MODAL
function sanitizeUserManagementModal() {
  const filePath = 'src/components/pms/UserManagementModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Role \(Video 23\)/g, 'Assigned Role');
  content = content.replace(/🛡️ Staff Shift Roster &amp; Boundary Controls \(Video 23\)/g, '🛡️ Staff Shift Roster &amp; Access Controls');
  content = content.replace(/Video 23: Hotel Staff Management &amp; Anti-Theft Protection Matrix/g, 'Hotel Staff Management &amp; Security Protection Matrix');
  content = content.replace(/In RoomG PMS, every staff member/g, 'In Hotel Sai Vasudev Residency ERP, every staff member');
  content = content.replace(/✓ Allowed Operations \(Frame 0185\):/g, '✓ Allowed Operations:');
  content = content.replace(/Video 21 Frame 0120 &bull; Multi-User Mobile, PC &amp; Laptop Controls/g, 'Enterprise Multi-User Mobile, PC &amp; Laptop Controls');
  content = content.replace(/title="Toggle Verification Status \(Frame 0120\)"/g, 'title="Toggle Verification Status"');
  content = content.replace(/'RoomG@123'/g, "'SaiVasudev@123'");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized UserManagementModal.tsx');
}

// 6. ROOM SHIFT MODAL
function sanitizeRoomShiftModal() {
  const filePath = 'src/components/pms/RoomShiftModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/ROOM SHIFTING &bull; HOW TO CHANGE GUEST ROOM \(VIDEO 11\)/g, 'ROOM SHIFTING &bull; GUEST TRANSFER MANAGEMENT');
  content = content.replace(/Per Day Room Tariff Rule \(Video 11 Category & Tariff Rule\)/g, 'Per Day Room Tariff Policy (Category & Tariff Rule)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized RoomShiftModal.tsx');
}

// 7. ROOM CHECK OUT MODAL
function sanitizeRoomCheckOutModal() {
  const filePath = 'src/components/pms/RoomCheckOutModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/<span>Make All Bill Local GST \(Video 10\)<\/span>/g, '<span>Enforce Local GST (CGST + SGST)</span>');
  content = content.replace(/title="Open Video 26 Multi-Format Bill Suite \(A4 Standard, Day-wise Breakdown, General Invoice, A5 Compact\)"/g, 'title="Open Multi-Format Bill Suite (A4 Standard, Day-wise Breakdown, General Invoice, A5 Compact)"');
  content = content.replace(/<span>🧾<\/span> Multi-Format Suite \(Video 26\)/g, '<span>🧾</span> Multi-Format Bill Suite');
  content = content.replace(/title="Toggle Personal \/ Non-commercial stay \(Video 07 Frame 0080\)"/g, 'title="Toggle Personal / Non-commercial stay"');
  content = content.replace(/title="Calculate Tax Inclusive \(Video 07 Frame 0130\)"/g, 'title="Calculate Tax Inclusive"');
  content = content.replace(/to prevent backdating fraud \(Video 23\)/g, 'as per security lock');
  content = content.replace(/locked for staff \(Video 23\)/g, 'locked as per staff permissions');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized RoomCheckOutModal.tsx');
}

// 8. SHIFT TABLE MODAL & SHIFT HANDOVER MODAL
function sanitizeShiftModals() {
  const shiftTablePath = 'src/components/pms/ShiftTableModal.tsx';
  if (fs.existsSync(shiftTablePath)) {
    let content = fs.readFileSync(shiftTablePath, 'utf8');
    content = content.replace(/<strong>Video 13 Business Rule:<\/strong>/g, '<strong>Table Shifting Policy:</strong>');
    fs.writeFileSync(shiftTablePath, content, 'utf8');
    console.log('Sanitized ShiftTableModal.tsx');
  }

  const shiftHandoverPath = 'src/components/pms/ShiftHandoverModal.tsx';
  if (fs.existsSync(shiftHandoverPath)) {
    let content = fs.readFileSync(shiftHandoverPath, 'utf8');
    content = content.replace(/Video 29 Frame 0490 Cash Drawer Handover/g, 'Front Office Cash Drawer Handover');
    fs.writeFileSync(shiftHandoverPath, content, 'utf8');
    console.log('Sanitized ShiftHandoverModal.tsx');
  }
}

// 9. STOCK REPORT MASTER MODAL
function sanitizeStockReportMasterModal() {
  const filePath = 'src/components/pms/StockReportMasterModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Video 34 Canonical Suite/g, 'Enterprise Inventory Suite');
  content = content.replace(/<span>Live Flow Simulator \(Video 34 Demo\)<\/span>/g, '<span>Live Flow Simulator</span>');
  content = content.replace(/Video 34 Canonical Inventory Demonstration &amp; Multi-Godown Lifecycle/g, 'Enterprise Multi-Godown Inventory Lifecycle');
  content = content.replace(/Step 1: Purchase Inward \(Frame 0140 \/purchases\/create\)/g, 'Step 1: Purchase Inward (/purchases/create)');
  content = content.replace(/Step 2: Inter-Store Stock Transfer \(Frame 0180 \/stocktransfers\/create\)/g, 'Step 2: Inter-Store Stock Transfer (/stocktransfers/create)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized StockReportMasterModal.tsx');
}

// 10. POLICE STATION REPORT MODAL
function sanitizePoliceStationReportModal() {
  const filePath = 'src/components/pms/PoliceStationReportModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/POLICE STATION REPORT &bull; ROOMG PMS/g, 'POLICE STATION REPORT &bull; HOTEL SAI VASUDEV RESIDENCY');
  content = content.replace(/Local Police Station &amp; CID Guest Verification Compliance \(Video 24\)/g, 'Local Police Station &amp; CID Guest Verification Compliance');
  content = content.replace(/<strong>Format 1<\/strong> &mdash; Interactive Grid with Guest &amp; ID Photos \(Frame 0110\)/g, '<strong>Format 1</strong> &mdash; Interactive Grid with Guest &amp; ID Photos');
  content = content.replace(/<strong>Format 2<\/strong> &mdash; Official Police Station Verification Statement PDF \(Frame 0140\)/g, '<strong>Format 2</strong> &mdash; Official Police Station Verification Statement PDF');
  content = content.replace(/System Generated by RoomG Hotel Management Software/g, 'System Generated by Hotel Sai Vasudev Residency ERP');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized PoliceStationReportModal.tsx');
}

// 11. BANQUET HALL BILLING MODAL
function sanitizeBanquetHallBillingModal() {
  const filePath = 'src/components/pms/BanquetHallBillingModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Video 35 Verified • RoomG Gold Standard/g, 'Verified Enterprise Standard');
  content = content.replace(/Frame 0700 Grand Tax Invoice/g, 'Grand Banquet Tax Invoice');
  content = content.replace(/Frame 0680 Auto-Housekeeping/g, 'Auto-Housekeeping Schedule');
  content = content.replace(/Exact replication of RoomG Video 35 \(Frames 0250, 0280, 0300\) with Multi-Room Group Linkage/g, 'Banquet & Event Management with Multi-Room Group Linkage');
  content = content.replace(/State \/ Jurisdiction \(Frame 0300\)/g, 'State / Jurisdiction');
  content = content.replace(/Venue Tariff \(₹\) \(Frame 0300\)/g, 'Venue Tariff (₹)');
  content = content.replace(/Multi-Room Group Linkage \(Video 35 Frame 0280\)/g, 'Multi-Room Group Linkage');
  content = content.replace(/As demonstrated in Video 35 \(Audio 16:30\):/g, 'Live Catering Adjustment:');
  content = content.replace(/Cumulative Banquet KOTs & Food Bill \(Frame 0550\)/g, 'Cumulative Banquet KOTs & Food Bill');
  content = content.replace(/Total F&B & Services \(Frame 0550\)/g, 'Total F&B & Services');
  content = content.replace(/Payment Settlement Detail \(Video 35 Frame 0650 - \/show_checkin\/235\)/g, 'Payment Settlement Detail (/show_checkin/235)');
  content = content.replace(/Billing Officer \(Frame 0700\)/g, 'Billing Officer');
  content = content.replace(/Save &amp; Settle To Room \(Frame 0650\)/g, 'Save &amp; Settle To Room');
  content = content.replace(/As highlighted in Video 35:/g, 'Automated Guest Notification:');
  content = content.replace(/Final Tax Invoice \(Frame 0700\)/g, 'Final Tax Invoice');
  content = content.replace(/RoomG PMS Video 35 Suite Completed • Cloudflare Production Ready/g, 'Hotel Sai Vasudev Residency Banquet Billing Suite');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized BanquetHallBillingModal.tsx');
}

// 12. LIQUOR BAR MANAGEMENT MODAL
function sanitizeLiquorBarManagementModal() {
  const filePath = 'src/components/pms/LiquorBarManagementModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Video 32 Full Demo/g, 'Bar POS Live Demo');
  content = content.replace(/Bar &amp; Table Billing POS \(Frame 0260\)/g, 'Bar &amp; Table Billing POS');
  content = content.replace(/Liquor Item Master \(\/item - Frame 0210\)/g, 'Liquor Item Master (/item)');
  content = content.replace(/Liquor Purchase Inward \(Frame 0320\)/g, 'Liquor Purchase Inward');
  content = content.replace(/RoomG Bar Logic \(Video 32\):/g, 'Beverage Billing Logic:');
  content = content.replace(/💾 Save &amp; Print Bill \(Frame 0260\)/g, '💾 Save &amp; Print Bill');
  content = content.replace(/🖨️ Print Customer Invoice \(Frame 0280\)/g, '🖨️ Print Customer Invoice');
  content = content.replace(/\+ Add New Item \(Frame 0210\)/g, '+ Add New Item');
  content = content.replace(/➕ Edit \/ Add New Liquor Item \(Frame 0180\)/g, '➕ Edit / Add New Liquor Item');
  content = content.replace(/Unit Master &amp; ML Conversion \(\/units - Frame 0120\)/g, 'Unit Master &amp; ML Conversion (/units)');
  content = content.replace(/Company \/ Brand Master \(\/company - Frame 0150\)/g, 'Company / Brand Master (/company)');
  content = content.replace(/Liquor Inward Purchase to Bar Godown \(Frame 0320\)/g, 'Liquor Inward Purchase to Bar Godown');
  content = content.replace(/Hotel Sai Vasudev Residency &bull; Bar &amp; Lounge POS &bull; RoomG Official License/g, 'Hotel Sai Vasudev Residency &bull; Bar &amp; Beverage Management');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized LiquorBarManagementModal.tsx');
}

// 13. TOP 20 FEATURES MODAL
function sanitizeTop20FeaturesModal() {
  const filePath = 'src/components/pms/Top20FeaturesModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/TOP 20 FEATURES OF ROOMG PMS HOTEL MANAGEMENT SOFTWARE/g, 'TOP 20 ENTERPRISE FEATURES OF HOTEL SAI VASUDEV RESIDENCY ERP');
  content = content.replace(/Comprehensive 20-Pillar Enterprise Architecture &bull; Spoken Hindi Training Series \(Video 27\) &bull; Best Hotel Software in India/g, 'Comprehensive 20-Pillar Enterprise Architecture &bull; Front Desk, Kitchen POS, Accounting & Cloud Sync');
  content = content.replace(/RoomG PMS integrates front desk/g, 'Hotel Sai Vasudev Residency ERP integrates front desk');
  content = content.replace(/RoomG PMS &bull; Official Software Licensing &amp; Demo Access/g, 'Hotel Sai Vasudev Residency ERP &bull; Master Enterprise Architecture');
  content = content.replace(/<span>🔑<\/span> Live Online Demo Access Credentials \(Frame 0055\)/g, '<span>🔑</span> Live Online Demo Access Credentials');
  content = content.replace(/📞 Data House ERP Sales &amp; Technical Support \(Frame 0060\)/g, '📞 ERP Technical Support &amp; Helpdesk');
  content = content.replace(/Showing <strong>\{filteredFeatures\.length\}<\/strong> of <strong>20<\/strong> Enterprise Features &bull; RoomG PMS Version 27\.0/g, 'Showing <strong>{filteredFeatures.length}</strong> of <strong>20</strong> Enterprise Features &bull; Hotel ERP v27.0');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized Top20FeaturesModal.tsx');
}

// 14. ONLINE VS OFFLINE MODAL
function sanitizeOnlineVsOfflineModal() {
  const filePath = 'src/components/pms/OnlineVsOfflineModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Video 25: 30-Dimension Feature Matrix, Hoteliers Decision Advisor &amp; Disaster Recovery Tools/g, 'Cloud vs Offline Architecture Matrix &amp; Disaster Recovery Tools');
  content = content.replace(/🎯 Hoteliers Decision Advisor \(Frame 0350\)/g, '🎯 Hoteliers Decision Advisor');
  content = content.replace(/⚡ RoomG Hybrid Sync &amp; Disaster Recovery/g, '⚡ Cloud Hybrid Sync &amp; Disaster Recovery');
  content = content.replace(/<div>RoomG PMS features a <strong>Hybrid Offline-First Architecture<\/strong> with zero data loss\.<\/div>/g, '<div>Hotel Sai Vasudev Residency ERP features a <strong>Hybrid Cloud-First Architecture</strong> with zero data loss.</div>');
  content = content.replace(/Summary: Which Version Should You Choose\? \(Frame 0350\)/g, 'Summary: Architecture Comparison &amp; Recommendation');
  content = content.replace(/RoomG Hybrid Engine Recommended 🚀/g, 'Enterprise Cloud Sync Active 🚀');
  content = content.replace(/RoomG PMS stores a continuous offline database locally in your browser\/desktop storage\./g, 'The system syncs continuous snapshots with the PostgreSQL Railway Cloud backend.');
  content = content.replace(/💡 RoomG Hybrid Offline Architecture Advantage:/g, '💡 Enterprise Cloud & Offline Continuity Advantage:');
  content = content.replace(/a\.download = `RoomG_SaiVasudev_Backup_\${dateStr}\.json`;/g, 'a.download = `SaiVasudev_Backup_${dateStr}.json`;');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized OnlineVsOfflineModal.tsx');
}

// 15. HELP AND SUPPORT MODAL
function sanitizeHelpAndSupportModal() {
  const filePath = 'src/components/pms/HelpAndSupportModal.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/RoomG Training &amp; Customer Support Suite/g, 'ERP Training &amp; Customer Support Suite');
  content = content.replace(/Video 30 Master Helpdesk/g, 'Enterprise Master Helpdesk');
  content = content.replace(/Official RoomG ERP Hindi video training suite for front desk receptionists, restaurant captains, accountants, and hotel owners\./g, 'Comprehensive training suite for front desk receptionists, restaurant captains, accountants, and hotel management.');
  content = content.replace(/RoomG Hotel Management Software Step-by-Step Training/g, 'Hotel Management Software Step-by-Step System Guides');
  content = content.replace(/RoomG PMS User Documentation Manual \(Roomg PMS - english\.pdf\)/g, 'Hotel PMS User Documentation Manual');
  content = content.replace(/RoomG Cloud PMS &bull; Enterprise 35-Module Edition/g, 'Hotel Sai Vasudev Residency PMS &bull; Enterprise Edition');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Sanitized HelpAndSupportModal.tsx');
}

// 16. DEVICE RESPONSIVE, CHAIN PROPERTY, NO DISCOUNT, AND REMAINING MODALS
function sanitizeRemainingComponents() {
  // DeviceResponsivePreviewModal.tsx
  const devPath = 'src/components/pms/DeviceResponsivePreviewModal.tsx';
  if (fs.existsSync(devPath)) {
    let content = fs.readFileSync(devPath, 'utf8');
    content = content.replace(/iPhone SE \(375x667\) \[Video 21 Exact\]/g, 'iPhone SE (375x667)');
    content = content.replace(/Multi-Device Mobile Responsive Simulator \(Video 21\)/g, 'Multi-Device Mobile Responsive Simulator');
    content = content.replace(/Exact Frame 0138-0150 Mobile UI • Live Interactive Preview • Responsive Touch Layout/g, 'Live Interactive Preview • Responsive Touch Layout');
    content = content.replace(/🏠 Mobile Home Dashboard \(Frame 0138\)/g, '🏠 Mobile Home Dashboard');
    content = content.replace(/🚪 Room Dashboard Cards \(Frame 0145\)/g, '🚪 Room Dashboard Cards');
    content = content.replace(/ROOMG Multi-Device Architecture:/g, 'Multi-Device Responsive Architecture:');
    fs.writeFileSync(devPath, content, 'utf8');
    console.log('Sanitized DeviceResponsivePreviewModal.tsx');
  }

  // ChainPropertyModal.tsx
  const chainPath = 'src/components/pms/ChainPropertyModal.tsx';
  if (fs.existsSync(chainPath)) {
    let content = fs.readFileSync(chainPath, 'utf8');
    content = content.replace(/ROOMG Multi-Branch Architecture • Video 21 Clone • Active Property Context Switching/g, 'Multi-Branch Architecture • Active Property Context Switching');
    content = content.replace(/<strong>💡 Multi-Location ROOMG Principle \(Video 21\):<\/strong>/g, '<strong>💡 Multi-Location Principle:</strong>');
    fs.writeFileSync(chainPath, content, 'utf8');
    console.log('Sanitized ChainPropertyModal.tsx');
  }

  // NoDiscountMasterModal.tsx
  const noDiscPath = 'src/components/pms/NoDiscountMasterModal.tsx';
  if (fs.existsSync(noDiscPath)) {
    let content = fs.readFileSync(noDiscPath, 'utf8');
    content = content.replace(/Video 33 Full Demo/g, 'Live Margin Demo');
    content = content.replace(/<span>Live Bill Simulator \(Frame 0180\)<\/span>/g, '<span>Live Bill Simulator</span>');
    content = content.replace(/Protected Product Categories &amp; Item Groups \(Video 33\):/g, 'Protected Product Categories &amp; Item Groups:');
    content = content.replace(/Exact Video 33 Recreation: Table T-10 Bill \(Res\/293\/24-25 - Frame 0180\)/g, 'Table T-10 Bill (Res/293/24-25)');
    content = content.replace(/Without RoomG Protection:/g, 'Standard Discount Applied:');
    content = content.replace(/With RoomG No-Discount Rules:/g, 'Protected (No-Discount Enforced):');
    content = content.replace(/Hotel Sai Vasudev Residency &bull; Price Integrity &bull; RoomG Video 33 Module/g, 'Hotel Sai Vasudev Residency &bull; Price Integrity &bull; Margin Protection');
    fs.writeFileSync(noDiscPath, content, 'utf8');
    console.log('Sanitized NoDiscountMasterModal.tsx');
  }

  // GuestLogModal.tsx
  const guestLogPath = 'src/components/pms/GuestLogModal.tsx';
  if (fs.existsSync(guestLogPath)) {
    let content = fs.readFileSync(guestLogPath, 'utf8');
    content = content.replace(/Video 29 Frame 0350 Lifetime Value Audit/g, 'Guest Lifetime Value Audit');
    content = content.replace(/&bull; RoomG Frame 0350/g, '');
    fs.writeFileSync(guestLogPath, content, 'utf8');
    console.log('Sanitized GuestLogModal.tsx');
  }

  // KitchenDashboardModal.tsx
  const kitchenPath = 'src/components/pms/KitchenDashboardModal.tsx';
  if (fs.existsSync(kitchenPath)) {
    let content = fs.readFileSync(kitchenPath, 'utf8');
    content = content.replace(/Video 12 Standard &bull; Android TV &amp; Kitchen Touch Terminal Mode/g, 'Android TV &amp; Kitchen Touch Terminal Mode');
    fs.writeFileSync(kitchenPath, content, 'utf8');
    console.log('Sanitized KitchenDashboardModal.tsx');
  }

  // KotEntryModal.tsx
  const kotPath = 'src/components/pms/KotEntryModal.tsx';
  if (fs.existsSync(kotPath)) {
    let content = fs.readFileSync(kotPath, 'utf8');
    content = content.replace(/title="Toggle Mobile Waiter Screen \(Video 14\)"/g, 'title="Toggle Mobile Waiter Screen"');
    fs.writeFileSync(kotPath, content, 'utf8');
    console.log('Sanitized KotEntryModal.tsx');
  }

  // PurchaseEntryModal.tsx
  const purchasePath = 'src/components/pms/PurchaseEntryModal.tsx';
  if (fs.existsSync(purchasePath)) {
    let content = fs.readFileSync(purchasePath, 'utf8');
    content = content.replace(/\(RoomG \/purchases\/create\)/g, '(/purchases/create)');
    fs.writeFileSync(purchasePath, content, 'utf8');
    console.log('Sanitized PurchaseEntryModal.tsx');
  }

  // StockTransferModal.tsx
  const stockTransPath = 'src/components/pms/StockTransferModal.tsx';
  if (fs.existsSync(stockTransPath)) {
    let content = fs.readFileSync(stockTransPath, 'utf8');
    content = content.replace(/\(RoomG \/stocktransfers\/create\)/g, '(/stocktransfers/create)');
    fs.writeFileSync(stockTransPath, content, 'utf8');
    console.log('Sanitized StockTransferModal.tsx');
  }

  // StoreWiseStockModal.tsx
  const storeStockPath = 'src/components/pms/StoreWiseStockModal.tsx';
  if (fs.existsSync(storeStockPath)) {
    let content = fs.readFileSync(storeStockPath, 'utf8');
    content = content.replace(/\(RoomG \/store_wise_stock\)/g, '(/store_wise_stock)');
    fs.writeFileSync(storeStockPath, content, 'utf8');
    console.log('Sanitized StoreWiseStockModal.tsx');
  }

  // RestaurantKotRegisterModal.tsx
  const restKotPath = 'src/components/pms/RestaurantKotRegisterModal.tsx';
  if (fs.existsSync(restKotPath)) {
    let content = fs.readFileSync(restKotPath, 'utf8');
    content = content.replace(/Restaurant KOT Register \(Video 18 Frame 0420\)/g, 'Restaurant KOT Register');
    content = content.replace(/title="Export KOT Register to CSV\/Excel \(Video 18 Transcript \[14:15\]\)"/g, 'title="Export KOT Register to CSV/Excel"');
    fs.writeFileSync(restKotPath, content, 'utf8');
    console.log('Sanitized RestaurantKotRegisterModal.tsx');
  }

  // RolesPermissionsModal.tsx
  const rolePermPath = 'src/components/pms/RolesPermissionsModal.tsx';
  if (fs.existsSync(rolePermPath)) {
    let content = fs.readFileSync(rolePermPath, 'utf8');
    content = content.replace(/&bull; Video 21 Frames 0130 &amp; 0132/g, '');
    content = content.replace(/title="Configure Rights & Permissions \(Frame 0132\)"/g, 'title="Configure Rights & Permissions"');
    fs.writeFileSync(rolePermPath, content, 'utf8');
    console.log('Sanitized RolesPermissionsModal.tsx');
  }

  // RoomCheckInRegisterModal.tsx
  const checkinRegPath = 'src/components/pms/RoomCheckInRegisterModal.tsx';
  if (fs.existsSync(checkinRegPath)) {
    let content = fs.readFileSync(checkinRegPath, 'utf8');
    content = content.replace(/Anti-Theft Guard Active \(Video 23\)/g, 'Security Policy Guard Active');
    content = content.replace(/Room Check In Register \(Video 11\)/g, 'Room Check In Register');
    content = content.replace(/title="Shift Room \(Video 11\)"/g, 'title="Shift Room"');
    fs.writeFileSync(checkinRegPath, content, 'utf8');
    console.log('Sanitized RoomCheckInRegisterModal.tsx');
  }

  // RoomKotRegisterModal.tsx
  const roomKotPath = 'src/components/pms/RoomKotRegisterModal.tsx';
  if (fs.existsSync(roomKotPath)) {
    let content = fs.readFileSync(roomKotPath, 'utf8');
    content = content.replace(/KOT Register & Mobile Order Tracking \(Video 14 Frame 0260\)/g, 'KOT Register & Mobile Order Tracking');
    fs.writeFileSync(roomKotPath, content, 'utf8');
    console.log('Sanitized RoomKotRegisterModal.tsx');
  }

  // UnconfirmedBookingsModal.tsx
  const unconfirmedPath = 'src/components/pms/UnconfirmedBookingsModal.tsx';
  if (fs.existsSync(unconfirmedPath)) {
    let content = fs.readFileSync(unconfirmedPath, 'utf8');
    content = content.replace(/Room Booking &bull; Unconfirmed Bookings Register \(Frame 0350 &amp; 0360\)/g, 'Room Booking &bull; Unconfirmed Bookings Register');
    fs.writeFileSync(unconfirmedPath, content, 'utf8');
    console.log('Sanitized UnconfirmedBookingsModal.tsx');
  }

  // WhatsAppSettingModal.tsx
  const waPath = 'src/components/pms/WhatsAppSettingModal.tsx';
  if (fs.existsSync(waPath)) {
    let content = fs.readFileSync(waPath, 'utf8');
    content = content.replace(/SUB-MODAL 1: EDIT \/ ADD TEMPLATE \(Exact RoomG Frame 0180\)/g, 'SUB-MODAL 1: EDIT / ADD TEMPLATE');
    fs.writeFileSync(waPath, content, 'utf8');
    console.log('Sanitized WhatsAppSettingModal.tsx');
  }

  // AgentCommissionModal.tsx
  const agentPath = 'src/components/pms/AgentCommissionModal.tsx';
  if (fs.existsSync(agentPath)) {
    let content = fs.readFileSync(agentPath, 'utf8');
    content = content.replace(/Video 31 Top 15 PMS Master Features/g, 'Key Enterprise PMS Master Features');
    content = content.replace(/Video 31 Canonical MR &amp; Salesman Master/g, 'Agent &amp; Referral Partner Master');
    fs.writeFileSync(agentPath, content, 'utf8');
    console.log('Sanitized AgentCommissionModal.tsx');
  }

  // OutstandingReceivablesModal.tsx
  const outPath = 'src/components/pms/OutstandingReceivablesModal.tsx';
  if (fs.existsSync(outPath)) {
    let content = fs.readFileSync(outPath, 'utf8');
    content = content.replace(/Video 15: /g, '');
    content = content.replace(/Frame 0130 /g, '');
    fs.writeFileSync(outPath, content, 'utf8');
    console.log('Sanitized OutstandingReceivablesModal.tsx');
  }

  // DayEndReportModal.tsx
  const dayEndPath = 'src/components/pms/DayEndReportModal.tsx';
  if (fs.existsSync(dayEndPath)) {
    let content = fs.readFileSync(dayEndPath, 'utf8');
    content = content.replace(/Video 29 /g, '');
    content = content.replace(/Frame 0480 /g, '');
    fs.writeFileSync(dayEndPath, content, 'utf8');
    console.log('Sanitized DayEndReportModal.tsx');
  }

  // ItemWiseStockModal.tsx
  const itemStockPath = 'src/components/pms/ItemWiseStockModal.tsx';
  if (fs.existsSync(itemStockPath)) {
    let content = fs.readFileSync(itemStockPath, 'utf8');
    content = content.replace(/Video 29 /g, '');
    content = content.replace(/Video 34 /g, '');
    content = content.replace(/Frame 0210/g, '');
    fs.writeFileSync(itemStockPath, content, 'utf8');
    console.log('Sanitized ItemWiseStockModal.tsx');
  }

  // ItemWiseSalesReportModal.tsx
  const itemSalePath = 'src/components/pms/ItemWiseSalesReportModal.tsx';
  if (fs.existsSync(itemSalePath)) {
    let content = fs.readFileSync(itemSalePath, 'utf8');
    content = content.replace(/Video 29 /g, '');
    content = content.replace(/Frame 0520 /g, '');
    fs.writeFileSync(itemSalePath, content, 'utf8');
    console.log('Sanitized ItemWiseSalesReportModal.tsx');
  }

  // GstReportsModal.tsx
  const gstPath = 'src/components/pms/GstReportsModal.tsx';
  if (fs.existsSync(gstPath)) {
    let content = fs.readFileSync(gstPath, 'utf8');
    content = content.replace(/_Generated via RoomG Hotel Management System \(Best PMS in India\)\. Please file GSTR-1 and GSTR-3B accordingly\._/g, '_Generated via Hotel Sai Vasudev Residency ERP. Please file GSTR-1 and GSTR-3B accordingly._');
    fs.writeFileSync(gstPath, content, 'utf8');
    console.log('Sanitized GstReportsModal.tsx');
  }
}

// 17. REMAINING SPECIFIC REPLACEMENTS (Round 2)
function sanitizeRoundTwo() {
  // AgentCommissionModal.tsx
  const agentPath = 'src/components/pms/AgentCommissionModal.tsx';
  if (fs.existsSync(agentPath)) {
    let content = fs.readFileSync(agentPath, 'utf8');
    content = content.replace(/Video 31 &bull; 100% Exact Clone/g, 'Enterprise Agent Architecture');
    content = content.replace(/Video 31 Agent Registration Module/g, 'Agent & Referral Registration Module');
    content = content.replace(/Canonical Enterprise Feature Set Presented in RoomG Training Video 31 &bull; Complete PMS Solution for Hotels & Resorts/g, 'Enterprise Feature Set &bull; Complete PMS Solution for Hotels & Resorts');
    fs.writeFileSync(agentPath, content, 'utf8');
    console.log('Round 2: Sanitized AgentCommissionModal.tsx');
  }

  // CompanyBrandingModal.tsx
  const compBrandPath = 'src/components/pms/CompanyBrandingModal.tsx';
  if (fs.existsSync(compBrandPath)) {
    let content = fs.readFileSync(compBrandPath, 'utf8');
    content = content.replace(/\(Video 26\)\./g, '.');
    content = content.replace(/ - Video 10 &amp; 26\)/g, ')');
    fs.writeFileSync(compBrandPath, content, 'utf8');
    console.log('Round 2: Sanitized CompanyBrandingModal.tsx');
  }

  // CompanyInfoModal.tsx
  const compInfoPath = 'src/components/pms/CompanyInfoModal.tsx';
  if (fs.existsSync(compInfoPath)) {
    let content = fs.readFileSync(compInfoPath, 'utf8');
    content = content.replace(/ &bull; Video 10 Core Feature/g, '');
    content = content.replace(/<strong>Video 10 Rule Explained:<\/strong>/g, '<strong>Tax Rule Explanation:</strong>');
    content = content.replace(/\(as shown in Video 10 Frames 0210 vs 0310\)/g, '');
    fs.writeFileSync(compInfoPath, content, 'utf8');
    console.log('Round 2: Sanitized CompanyInfoModal.tsx');
  }

  // DayEndReportModal.tsx
  const dayEndPath = 'src/components/pms/DayEndReportModal.tsx';
  if (fs.existsSync(dayEndPath)) {
    let content = fs.readFileSync(dayEndPath, 'utf8');
    content = content.replace(/&bull; Frame 0240 Audit Register/g, '&bull; Daily Audit Register');
    content = content.replace(/Official Day End Report &bull; As shown in RoomG PMS Training \(Frame 0240\)/g, 'Official Day End Report (Night Audit Register)');
    fs.writeFileSync(dayEndPath, content, 'utf8');
    console.log('Round 2: Sanitized DayEndReportModal.tsx');
  }

  // FoodBillModal.tsx
  const foodBillPath = 'src/components/pms/FoodBillModal.tsx';
  if (fs.existsSync(foodBillPath)) {
    let content = fs.readFileSync(foodBillPath, 'utf8');
    content = content.replace(/title="No Discount Item \(Video 33\)"/g, 'title="No Discount Item (Protected)"');
    fs.writeFileSync(foodBillPath, content, 'utf8');
    console.log('Round 2: Sanitized FoodBillModal.tsx');
  }

  // HelpAndSupportModal.tsx
  const helpPath = 'src/components/pms/HelpAndSupportModal.tsx';
  if (fs.existsSync(helpPath)) {
    let content = fs.readFileSync(helpPath, 'utf8');
    content = content.replace(/As emphasized by our training head in Video 30:/g, 'Support Policy:');
    content = content.replace(/As outlined in Video 30: Connect directly with our Jabalpur Headquarters team for free live software demonstrations, branch onboarding, or license renewal\./g, 'Connect directly with our support desk for live software demonstrations, branch onboarding, or assistance.');
    fs.writeFileSync(helpPath, content, 'utf8');
    console.log('Round 2: Sanitized HelpAndSupportModal.tsx');
  }

  // HotelBillFormatModal.tsx
  const billFormatPath = 'src/components/pms/HotelBillFormatModal.tsx';
  if (fs.existsSync(billFormatPath)) {
    let content = fs.readFileSync(billFormatPath, 'utf8');
    content = content.replace(/<strong>Video 26 Pro-Tip:<\/strong>/g, '<strong>Printing Pro-Tip:</strong>');
    fs.writeFileSync(billFormatPath, content, 'utf8');
    console.log('Round 2: Sanitized HotelBillFormatModal.tsx');
  }

  // ItemWiseSalesReportModal.tsx
  const saleRepPath = 'src/components/pms/ItemWiseSalesReportModal.tsx';
  if (fs.existsSync(saleRepPath)) {
    let content = fs.readFileSync(saleRepPath, 'utf8');
    content = content.replace(/ &bull; RoomG Frame 0220/g, '');
    fs.writeFileSync(saleRepPath, content, 'utf8');
    console.log('Round 2: Sanitized ItemWiseSalesReportModal.tsx');
  }

  // ItemWiseStockModal.tsx
  const itemStockPath = 'src/components/pms/ItemWiseStockModal.tsx';
  if (fs.existsSync(itemStockPath)) {
    let content = fs.readFileSync(itemStockPath, 'utf8');
    content = content.replace(/&bull; Frame 0410 Kitchen Stock Audit/g, '&bull; Kitchen Stock Audit');
    content = content.replace(/RoomG PMS Inventory &amp; Consumption Stock Ledger &bull; Frame 0410/g, 'Inventory &amp; Consumption Stock Ledger');
    fs.writeFileSync(itemStockPath, content, 'utf8');
    console.log('Round 2: Sanitized ItemWiseStockModal.tsx');
  }

  // NewRoomCheckInModal.tsx
  const newCheckInPath = 'src/components/pms/NewRoomCheckInModal.tsx';
  if (fs.existsSync(newCheckInPath)) {
    let content = fs.readFileSync(newCheckInPath, 'utf8');
    content = content.replace(/Anti-Backdating Guard \(Video 23\)/g, 'Anti-Backdating Guard');
    content = content.replace(/\(Video 23 Anti-Backdating Protection\)/g, '(Anti-Backdating Security Policy)');
    content = content.replace(/\(Video 23 Anti-Theft Guard\)/g, '(Tariff Protection Guard)');
    content = content.replace(/restricted from unauthorized discounts \(Video 23\)/g, 'restricted from unauthorized discounts');
    fs.writeFileSync(newCheckInPath, content, 'utf8');
    console.log('Round 2: Sanitized NewRoomCheckInModal.tsx');
  }

  // OnlineGuestBookingModal.tsx
  const onlineBookPath = 'src/components/pms/OnlineGuestBookingModal.tsx';
  if (fs.existsSync(onlineBookPath)) {
    let content = fs.readFileSync(onlineBookPath, 'utf8');
    content = content.replace(/ \(Video 20\)/g, '');
    fs.writeFileSync(onlineBookPath, content, 'utf8');
    console.log('Round 2: Sanitized OnlineGuestBookingModal.tsx');
  }

  // OutstandingReceivablesModal.tsx
  const outRecPath = 'src/components/pms/OutstandingReceivablesModal.tsx';
  if (fs.existsSync(outRecPath)) {
    let content = fs.readFileSync(outRecPath, 'utf8');
    content = content.replace(/ &bull; Video 29 Frame 0140/g, ' &bull; Receivables Register');
    content = content.replace(/ &bull; Video 29 Frame 0160/g, ' &bull; Payables Register');
    content = content.replace(/ \(Cr - Frame 0160\)/g, ' (Creditors)');
    content = content.replace(/RoomG Hotel Management PMS &bull; Frame 0140 \(Receivables\) &amp; Frame 0160 \(Payables\)/g, 'Hotel Sai Vasudev Residency ERP &bull; Receivables &amp; Payables Master');
    fs.writeFileSync(outRecPath, content, 'utf8');
    console.log('Round 2: Sanitized OutstandingReceivablesModal.tsx');
  }

  // PartyLedgerModal.tsx
  const partyPath = 'src/components/pms/PartyLedgerModal.tsx';
  if (fs.existsSync(partyPath)) {
    let content = fs.readFileSync(partyPath, 'utf8');
    content = content.replace(/ &bull; Video 17 Double-Entry Statement/g, ' &bull; Double-Entry Statement');
    fs.writeFileSync(partyPath, content, 'utf8');
    console.log('Round 2: Sanitized PartyLedgerModal.tsx');
  }
}

function runAll() {
  console.log('Starting comprehensive sanitization...');
  sanitizeHotelPmsModal();
  sanitizePmsHomeDashboardModal();
  sanitizeHotelBillFormatModal();
  sanitizeNewRoomCheckInModal();
  sanitizeUserManagementModal();
  sanitizeRoomShiftModal();
  sanitizeRoomCheckOutModal();
  sanitizeShiftModals();
  sanitizeStockReportMasterModal();
  sanitizePoliceStationReportModal();
  sanitizeBanquetHallBillingModal();
  sanitizeLiquorBarManagementModal();
  sanitizeTop20FeaturesModal();
  sanitizeOnlineVsOfflineModal();
  sanitizeHelpAndSupportModal();
  sanitizeRemainingComponents();
  sanitizeRoundTwo();
  console.log('Comprehensive sanitization complete!');
}

runAll();


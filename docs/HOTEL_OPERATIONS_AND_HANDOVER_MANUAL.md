# Hotel Sai Vasudev Residency — Official Operations & Handover Manual
**Property**: Hotel Sai Vasudev Residency (Boutique Pilgrimage & Business Hotel)  
**Location**: Main Road, Rayagada, Odisha – 765001  
**Proprietor / Legal Entity**: Paidisetty Manmadha Rao  
**GSTIN**: `21AEKPP8689J1ZS` | **PAN**: `AEKPP8689J`  
**Production URL**: [https://hotel-sai-vasudev-residency.pages.dev](https://hotel-sai-vasudev-residency.pages.dev)  
**System Architecture**: Cloudflare Pages (Frontend) + FastAPI & PostgreSQL (Cloud ERP) + Dexie IndexedDB v2 (Front Desk Offline Resilience) + Hardware Bridge (Thermal ESC/POS & Cash Drawer)

---

## Document Structure (Diataxis Framework)
* **Part 1: Tutorials** — Hands-on onboarding for receptionists on Day 1.
* **Part 2: How-To Guides** — Step-by-step procedures for daily front-desk and back-office tasks.
* **Part 3: Reference** — Official room inventory, tariff matrix, tax codes, bank details, and hardware configuration.
* **Part 4: Explanation & Architecture** — How the offline-first database, GST rounding, and peripheral security work.

---

# Part 1: Tutorials (Day 1 Receptionist Onboarding)

### Tutorial 1: Starting Your Front-Desk Shift
1. Turn on the Front Desk computer.
2. Open Google Chrome or Microsoft Edge and open:
   👉 **`https://hotel-sai-vasudev-residency.pages.dev`**
3. Click **"🔑 Staff ERP / PMS Portal"** or **"🔑 Receptionist PMS"** in the top navigation bar.
4. If a thermal receipt printer or electronic cash drawer is connected via USB:
   * Open the desktop shortcut **"Start Hardware Bridge"** (or run `python backend/hardware_bridge.py` in PowerShell).
   * Confirm the green status indicator: **"Hardware Bridge Connected (Port 8080)"**.
5. Check the top status bar: verify that the 18 rooms are loaded with their color-coded cards (🟢 Vacant Clean, 🔵 Occupied, 🔴 Dirty).

---

### Tutorial 2: Checking In a Walk-In Guest (2-Minute Workflow)
1. On the Room Grid, find an available **🟢 Ready** room (e.g., Room 101).
2. Click **"+ Check-In"** on that room card. The **New Room Check-In** dialog will open.
3. **Guest Identity Verification**:
   * Ask the guest for their Government ID (Aadhaar, Passport, Voter ID, Driving License).
   * **Instant Aadhaar QR Scan**: Point the USB 2D barcode scanner at the guest's Aadhaar card QR code. The system automatically populates Name, Gender, DOB, and masked Aadhaar number.
   * **Manual Entry**: Enter Guest Name, Mobile Number, and City.
4. **Stay Details**:
   * Default stay is 1 night. Select departure date if the guest requests multiple nights.
   * Number of Pax: 1 or 2 adults (extra bedding adds ₹300/night if selected).
5. **Tariff & Advance**:
   * Official tariff is pre-filled (e.g., ₹1,500 for Deluxe).
   * If the guest pays an advance, select payment mode (**Cash**, **UPI QR**, or **Card**) and enter the amount.
6. Click **"Confirm Check-In"**.
   * Room 101 instantly turns **🔵 Occupied**.
   * A check-in receipt and guest welcome slip are printed.
   * The guest's Master Folio is initialized.

---

### Tutorial 3: In-Room Dining & Kitchen Order Tickets (KOT)
1. When a guest in Room 101 calls intercom for room service:
2. Click on Room 101 on the dashboard and select **"🍽️ New KOT / Room Service"**.
3. Select ordered items from the Pure Vegetarian menu (e.g., *Paneer Butter Masala*, *Tandoori Roti*, *Masala Chai*).
4. Select billing destination:
   * **Transfer to Room Folio** *(Recommended)*: Added directly to the guest's final room bill.
   * **Direct Cash / UPI Settlement**: Generates an immediate food bill receipt (SAC 996331 @ 5% GST).
5. Click **"Fire KOT"**:
   * The kitchen thermal printer prints the order ticket with Timestamp, Room 101, Steward name, and Items.
   * If transferred to folio, Room 101's accrued balance increases automatically.

---

### Tutorial 4: Express Check-Out & Tax Invoice Settlement
1. When the guest approaches the front desk to depart:
2. Click on the occupied room card (Room 101) and click **"🛎️ Check-Out & Settle"**.
3. The **Checkout Settlement Drawer** displays:
   * Room Tariff charges (SAC 996311 with 12% GST breakdown: 6% CGST + 6% SGST).
   * Restaurant & Room Service charges (SAC 996331 with 5% GST: 2.5% CGST + 2.5% SGST).
   * Less: Advance payments already collected.
   * **Net Balance Due** (rounded to the nearest whole rupee per Section 170 CGST Act).
4. Choose settlement mode:
   * **UPI Dynamic QR**: Display the dynamic QR on screen for instant PhonePe/GPay scan.
   * **Cash**: Enter cash tendered; the electronic cash drawer kicks open automatically.
   * **Split Payment**: e.g., ₹1,000 Cash + ₹800 UPI.
5. Click **"Settle & Generate Tax Invoice"**.
   * Master Folio status changes to **SETTLED**.
   * Formatted GST Tax Invoice is printed (A4 or 80mm thermal).
   * Room status shifts to **🔴 Dirty / Housekeeping Needed**.

---

# Part 2: How-To Guides (Operational Recipes)

### How to Shift a Guest to Another Room
1. Open the Room Action Drawer for the occupied room.
2. Click **"🔄 Shift Room"**.
3. Select the destination room from the list of available clean rooms.
4. Enter the reason for shift (e.g., *"Guest requested 1st floor quiet room"* or *"AC cooling maintenance"*).
5. Click **"Confirm Shift"**.
   * All folio charges, orders, and payments transfer seamlessly to the new room.
   * The previous room is marked **🔴 Dirty** for housekeeping sanitization.

### How to Manage Housekeeping & Room Status
* **Marking Clean**: When housekeeping completes room cleaning, click **"🧽 Status Toggle"** on the room card to change it from **🔴 Dirty** to **🟢 Ready Clean**.
* **Maintenance Block**: If plumbing, electrical, or painting work is required, click **"⚙️ Maintenance"**. The room will be blocked from walk-in check-in until released.

### How to Record Petty Cash & Hotel Expenses
1. In the top toolbar, click **"💰 Petty Cash & Expenses"**.
2. Click **"+ Add Expenditure"**.
3. Select Category: *Kitchen Groceries, Dairy/Milk, Housekeeping Supplies, Linen Laundry, Diesel for Generator, Electricity/Water, Staff Tea*.
4. Enter Amount, Vendor Name, Vendor GSTIN (if applicable for input tax credit), and Payment Mode.
5. Click **"Save Expense"**. The daily cash drawer balance adjusts in real time.

### How to Process Staff Advances & Monthly Payroll
1. Click **"👥 Staff & Payroll"** in the PMS navigation.
2. **Recording Salary Advance**:
   * Select staff member (e.g., Steward, Cook, Housekeeper).
   * Click **"+ Disburse Advance"**, enter amount and reason.
3. **Monthly Pay Run**:
   * At month-end, click **"Generate Monthly Payroll"**.
   * The system automatically computes: `Base Salary - Total Advances Deducted = Net Salary Payable`.
   * Click **"Disburse via Bank / Cash"** and print the employee Pay Slip.

### How to Run the Night Audit & End-of-Day (EOD) Close
1. At the end of the shift (typically 11:30 PM or 12:00 AM), click **"🌙 Night Audit / EOD"**.
2. Review the automated financial summary:
   * Total Room Revenue collected.
   * Total Restaurant / In-Room Dining revenue.
   * Physical Cash in Drawer vs. System Recorded Cash.
   * Total UPI / Card receipts.
   * Total Petty Cash disbursed.
3. Enter physical cash counted in the cash drawer to check for zero discrepancy.
4. Click **"Close Business Day & Archive"**.

### How to Export Data for the Chartered Accountant (CA)
1. Click **"📊 CA Export & GST"** in the top menu.
2. Select the calendar month (e.g., October 2026).
3. Click **"Generate GST & Financial Ledger"**.
4. The system produces:
   * **GSTR-1 B2C Small Ledger**: Room accommodation invoices (SAC 996311) and food sales (SAC 996331).
   * **GSTR-3B Summary**: Total Taxable Value, CGST, and SGST liability.
   * **Operating P&L**: Net Revenue excluding taxes minus Operating Expenses.
5. Click **"📥 Download Excel / JSON for CA"**. Forward this file directly to the hotel's auditor.

---

# Part 3: Reference Specifications

### 1. 18-Room Official Inventory & Tariff Matrix
Sri Sai Vasudev Residency operates exactly 18 guest rooms across two floors:

| Room No. | Floor | Room Category | Bed Type | Standard Tariff | GST Slab | Total Tariff |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
| **101** | Ground Floor | Deluxe | King Bed | ₹1,339.29 | 12% (SAC 996311) | **₹1,500** |
| **102** | Ground Floor | Deluxe | King Bed | ₹1,339.29 | 12% (SAC 996311) | **₹1,500** |
| **103** | Ground Floor | Classic Studio | Twin / Queen | ₹1,785.71 | 12% (SAC 996311) | **₹2,000** |
| **104** | Ground Floor | Classic Studio | Twin / Queen | ₹1,785.71 | 12% (SAC 996311) | **₹2,000** |
| **105** | Ground Floor | Classic Studio | Twin / Queen | ₹1,785.71 | 12% (SAC 996311) | **₹2,000** |
| **106** | Ground Floor | Executive | King + Work Desk | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **107** | Ground Floor | Executive | King + Work Desk | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **201** | 1st Floor | Executive | King + Balcony | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **202** | 1st Floor | Deluxe | King Bed | ₹1,339.29 | 12% (SAC 996311) | **₹1,500** |
| **203** | 1st Floor | Classic Studio | Queen Bed | ₹1,785.71 | 12% (SAC 996311) | **₹2,000** |
| **204** | 1st Floor | Classic Studio | Queen Bed | ₹1,785.71 | 12% (SAC 996311) | **₹2,000** |
| **205** | 1st Floor | Classic Studio | Queen Bed | ₹1,785.71 | 12% (SAC 996311) | **₹2,000** |
| **206** | 1st Floor | Executive | King Bed | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **207** | 1st Floor | Executive | King Bed | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **208** | 1st Floor | Executive | King Bed | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **209** | 1st Floor | Executive | King Bed | ₹2,232.14 | 12% (SAC 996311) | **₹2,500** |
| **210** | 1st Floor | Premium Suite | Luxury King + Living | ₹2,678.57 | 12% (SAC 996311) | **₹3,000** |
| **211** | 1st Floor | Premium Suite | Luxury King + Living | ₹2,678.57 | 12% (SAC 996311) | **₹3,000** |

---

### 2. Tax Codes & Statutory Compliance
* **Room Accommodation**: Services Accounting Code **SAC `996311`**.
  * Tax Rate: **12% GST** (6% CGST + 6% SGST).
* **Restaurant & In-Room Dining**: Services Accounting Code **SAC `996331`**.
  * Tax Rate: **5% GST** (2.5% CGST + 2.5% SGST) without Input Tax Credit.
* **Section 170 CGST Act Mandate**:
  * All final invoices, tax amounts, and balances due must be rounded off to the nearest whole Indian Rupee (paise $\ge 50$ rounded up, $< 50$ truncated). The system automatically tracks any difference under `round_off_amount`.

---

### 3. Hotel Business & Financial Identity
* **Legal Business Name**: Sri Sai Vasudev Residency (Paidisetty Manmadha Rao)
* **GSTIN**: `21AEKPP8689J1ZS` (Odisha State Code: `21`)
* **PAN**: `AEKPP8689J`
* **Bank Details**:
  * Bank Name: State Bank of India (SBI), Rayagada Main Branch
  * Account Number: Configured in PMS Settings
  * IFSC Code: `SBIN0000169`
* **UPI VPA / QR**: `9440289999@sbi` (or dynamic merchant UPI QR)
* **Front Desk Intercom & Hotline**: `+91 94402 89999`

---

# Part 4: Explanation & System Architecture

### 1. Offline-First Architecture (Dexie IndexedDB v2)
Unlike generic cloud software that freezes when internet drops:
* Hotel Sai Vasudev Residency uses **Dexie IndexedDB v2** on the front-desk browser.
* All guest records, check-ins, KOT tickets, and heavy guest ID proof images (Aadhaar scans) are stored in client-side high-capacity indexed storage (hundreds of megabytes available, avoiding the 5MB localStorage limit).
* When the internet is active, data syncs continuously with the Railway cloud database. If internet disconnects, receptionists can continue checking in guests, placing KOTs, and printing bills without interruption.

### 2. Hardware Bridge & Peripheral Security
* **Port**: Runs locally on `http://127.0.0.1:8080`.
* **Security Guardrail**: Protected by `X-Hardware-Token`. Arbitrary browser tabs or rogue scripts cannot trigger the physical cash drawer.
* **Cash Drawer Pulse**: Generates a standard ESC/POS solenoid kick pulse (`\x1b\x70\x00\x19\xfa`) over USB thermal receipt printers (EPSON, TVS, NGX).
* **RFID Keycard Encoder**: Supports MIFARE 1K 13.56MHz cards for room locks.

---

### Document Approval & Delivery Sign-Off
* **System Version**: PMS & ERP v2.4 (Hardened 8-Agent Production Build)
* **Status**: Approved & Ready for Operations
* **Handover Date**: November 7, 2026
* **Certified by**: Principal Systems Architect & Lead System Documentarian


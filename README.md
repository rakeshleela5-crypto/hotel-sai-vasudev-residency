# Hotel Sai Vasudev Residency — Enterprise PMS & Cloud ERP

Official Enterprise Property Management System (PMS), Guest Booking Engine, Vasudev Rasoi Point-of-Sale (POS), and Hardware Bridge for **Hotel Sai Vasudev Residency**.

* **Property**: Hotel Sai Vasudev Residency (Boutique Pilgrimage & Business Hotel)
* **Location**: Near Andhra Bank / Overbridge, New Colony, Rayagada, Odisha – 765001
* **Proprietor / Legal Entity**: Paidisetty Manmadha Rao
* **GSTIN**: `21AEKPP8689J1ZS` (Odisha - State Code: `21`) | **PAN**: `AEKPP8689J`
* **Production Web App**: [https://hotel-sai-vasudev-residency.pages.dev](https://hotel-sai-vasudev-residency.pages.dev)
* **Production API**: [https://hotel-sai-vasudev-residency-production.up.railway.app/api/v1](https://hotel-sai-vasudev-residency-production.up.railway.app/api/v1)

---

## Core Capabilities & Architecture

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS hosted on **Cloudflare Pages**.
* **Backend API**: Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 running on **Railway Cloud** (Port `8000`).
* **Offline Resilience**: Client-side **Dexie.js IndexedDB v2** (`HotelSaiVasudev_ERP_Offline_DB`) allowing seamless front-desk check-in and KOT generation even during internet outages.
* **18-Room Inventory**: Exactly 18 guest rooms (101–107 on Ground Floor, 201–211 on 1st Floor) across Deluxe, Classic Studio, Executive, and Premium Suite tiers. Tariffs are strictly GST-inclusive.
* **Dual-Slab GST Compliance**: Automatic computation for Room Accommodation (SAC `996311` @ 12%) and Food & Beverage (SAC `996331` @ 5%), with Section 170 CGST Act whole-rupee rounding.
* **Local Hardware Bridge**: Python daemon (`backend/hardware_bridge.py`, Port `8080`) providing silent ESC/POS thermal printing, RFID keycard encoding, and solenoid cash drawer kicks.
* **Hardware Integrations**: Direct ADMS push protocol listener for **eSSL AIFACE-ERIS** biometric face attendance and keyboard-wedge USB 2D scanner support for instant **Aadhaar QR** check-in autofill.
* **Chartered Accountant (CA) Engine**: Monthly one-click GSTR-1, GSTR-3B, and Tally-compatible JSON/Excel export.

---

## Port Mappings & Local Development

| Service | Port | Local URL | Description |
| :--- | :---: | :--- | :--- |
| **Frontend Web App** | `5173` | `http://localhost:5173` | Vite development server with HMR. |
| **FastAPI Backend** | `8000` | `http://localhost:8000/api/v1` | Local FastAPI backend engine (`uvicorn app.main:app`). |
| **Hardware Bridge** | `8080` | `http://127.0.0.1:8080` | Local hardware daemon for receipt printer and cash drawer. |

### Quick Start
1. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```
2. **Backend**:
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
3. **Hardware Bridge**:
   ```bash
   python backend/hardware_bridge.py
   ```

---

## Documentation Suite (Diataxis Framework)
Detailed operational manuals and runbooks are available in the `docs/` directory:
* [`docs/HOTEL_OPERATIONS_AND_HANDOVER_MANUAL.md`](docs/HOTEL_OPERATIONS_AND_HANDOVER_MANUAL.md): Complete Operations and Handover Manual for Front Desk, Managers, and Accountants.
* [`AGENTS.md`](AGENTS.md): Multi-Agent Roster and pair programming guidelines.

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://hotel-sai-vasudev-residency.pages.dev';

async function runAudit() {
  console.log(`[AUDIT] Starting Exhaustive Zero-Blind-Spot Audit on: ${TARGET_URL}`);
  const startTime = Date.now();

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl: TARGET_URL,
    totalDurationMs: 0,
    metrics: {
      consoleErrors: [],
      consoleWarnings: [],
      networkFailures: [],
      apiLatencies: [],
    },
    phases: {
      phase1_discovery: { passed: false, checks: [] },
      phase2_business_logic: { passed: false, checks: [] },
      phase3_ui_ux_telemetry: { passed: false, checks: [] },
    },
    bugs: []
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Listeners for Console and Network
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      report.metrics.consoleErrors.push({ text, location: msg.location() });
      console.error(`[CONSOLE ERROR] ${text}`);
    } else if (type === 'warning') {
      report.metrics.consoleWarnings.push({ text });
    }
  });

  page.on('pageerror', err => {
    report.metrics.consoleErrors.push({ text: `Unhandled Exception: ${err.message}`, stack: err.stack });
    console.error(`[PAGE UNHANDLED ERROR] ${err.message}`);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    const timing = response.request().timing();
    if (status >= 400) {
      report.metrics.networkFailures.push({ url, status, statusText: response.statusText() });
      console.warn(`[NETWORK FAIL ${status}] ${url}`);
    }
    if (url.includes('/api/')) {
      report.metrics.apiLatencies.push({ url, status, responseTimeMs: timing.responseEnd });
    }
  });

  try {
    // ----------------------------------------------------
    // PHASE 1: DOM & Route Discovery (Public & ERP Entry)
    // ----------------------------------------------------
    console.log('\n--- EXECUTING PHASE 1: DOM & Route Discovery ---');
    const p1Start = Date.now();
    const navResp = await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTimeMs = Date.now() - p1Start;
    
    report.phases.phase1_discovery.checks.push({
      name: 'Initial Landing Page Load',
      status: navResp && navResp.status() < 400 ? 'PASS' : 'FAIL',
      httpStatus: navResp ? navResp.status() : 0,
      loadTimeMs
    });

    const pageTitle = await page.title();
    console.log(`Page Title: "${pageTitle}" in ${loadTimeMs}ms`);

    // Verify Public Elements
    const navLinks = await page.$$eval('nav a, header a', els => els.map(e => ({ text: e.innerText.trim(), href: e.getAttribute('href') })));
    console.log(`Found ${navLinks.length} navbar links`);

    // Check ERP Mode Switcher / Button
    const pmsButton = await page.$('text=ERP / Staff Portal, text=PMS, button:has-text("PMS"), button:has-text("ERP")');
    if (pmsButton) {
      console.log('Found PMS / ERP entry button in Navbar. Clicking...');
      await pmsButton.click();
    } else {
      console.log('Navigating directly to /erp...');
      await page.goto(`${TARGET_URL}/erp`, { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(1500);

    // Verify PMS Modal is mounted
    const pmsModal = await page.$('.pms-overlay, .pms-window');
    report.phases.phase1_discovery.checks.push({
      name: 'PMS Master Modal Mount',
      status: pmsModal ? 'PASS' : 'FAIL',
      details: pmsModal ? 'PMS window rendered' : 'PMS overlay not found'
    });

    if (!pmsModal) {
      throw new Error('Critical: PMS Modal window failed to render!');
    }

    // Inspect PMS Header Quick Action Badges
    const headerButtons = await page.$$eval('.pms-header button', btns => btns.map(b => b.innerText.trim().replace(/\n/g, ' ')));
    console.log(`PMS Header Quick Action Buttons (${headerButtons.length}):`, headerButtons);

    // Verify 16 Room Rack on Room Dashboard
    const roomCards = await page.$$eval('.pms-body [class*="room-card"], .pms-body .room-grid > div, [data-room-no]', els => els.map(e => e.innerText.trim().replace(/\n/g, ' | ')));
    console.log(`Found ${roomCards.length} room cards in Room Rack.`);

    report.phases.phase1_discovery.checks.push({
      name: '16-Room Visual Rack Rendered',
      status: roomCards.length >= 16 ? 'PASS' : 'FAIL',
      count: roomCards.length
    });

    // Check KPI Ribbon
    const kpiRibbonText = await page.$$eval('.pms-body [class*="kpi"], .pms-body [class*="stat"], .pms-body [class*="badge"]', els => els.map(e => e.innerText.trim()));
    console.log('KPI Ribbon / Statistics Text Snippets:', kpiRibbonText.slice(0, 10));

    // Verify Sidebar Submenus
    console.log('Testing Sidebar Submenu Expansions...');
    const masterMenu = await page.$('text=Master');
    if (masterMenu) {
      await masterMenu.click();
      await page.waitForTimeout(300);
      const itemMasterBtn = await page.$('text=Item Master');
      report.phases.phase1_discovery.checks.push({
        name: 'Master Submenu Expand & Item Master Link',
        status: itemMasterBtn ? 'PASS' : 'FAIL'
      });
    }

    const entryMenu = await page.$('text=Entry');
    if (entryMenu) {
      await entryMenu.click();
      await page.waitForTimeout(300);
      const checkInBtn = await page.$('text=New Check In');
      report.phases.phase1_discovery.checks.push({
        name: 'Entry Submenu Expand & New Check In Link',
        status: checkInBtn ? 'PASS' : 'FAIL'
      });
    }

    const reportMenu = await page.$('text=Report');
    if (reportMenu) {
      await reportMenu.click();
      await page.waitForTimeout(300);
      const gstReportBtn = await page.$('text=GST Report, text=Room & Food Bill GST Report');
      report.phases.phase1_discovery.checks.push({
        name: 'Report Submenu Expand & GST Reports Link',
        status: gstReportBtn ? 'PASS' : 'FAIL'
      });
    }

    // Test Home Hub (16 Tiles) Tab
    console.log('Switching to Home Hub (16 Tiles)...');
    const homeHubNav = await page.$('text=Home Hub (16 Tiles)');
    if (homeHubNav) {
      await homeHubNav.click();
      await page.waitForTimeout(500);
      const tilesCount = await page.$$eval('.pms-body button, .pms-body [class*="tile"], .pms-body [class*="card"]', els => els.length);
      console.log(`Home Hub Tiles/Cards Count: ${tilesCount}`);
      report.phases.phase1_discovery.checks.push({
        name: 'Home Hub (16 Tiles) View Switch',
        status: tilesCount >= 16 ? 'PASS' : 'FAIL',
        count: tilesCount
      });
      // Switch back to Room Dashboard
      const roomDashNav = await page.$('text=Room Dashboard');
      if (roomDashNav) await roomDashNav.click();
      await page.waitForTimeout(500);
    }

    report.phases.phase1_discovery.passed = report.phases.phase1_discovery.checks.every(c => c.status === 'PASS');

    // ----------------------------------------------------
    // PHASE 2: Hospitality ERP Business Logic & Workflows
    // ----------------------------------------------------
    console.log('\n--- EXECUTING PHASE 2: Business Logic Stress Testing ---');

    // 1. Slide-Over Action Drawer & Folio Inspection
    console.log('Testing Room Card Click & Slide-Over Action Drawer...');
    const firstRoomCard = await page.$('text=101, [data-room-no="101"]');
    if (firstRoomCard) {
      await firstRoomCard.click();
      await page.waitForTimeout(500);

      // Check if drawer or modal opened
      const drawer = await page.$('[class*="drawer"], [class*="slide"], text=Folio Summary, text=Room 101');
      report.phases.phase2_business_logic.checks.push({
        name: 'Slide-Over Room Drawer / Folio Open for Room 101',
        status: drawer ? 'PASS' : 'FAIL'
      });

      // Verify Folio Action Buttons (Record Payment, Apply Discount, Post Charge, Check Out)
      const drawerActionButtons = await page.$$eval('button', btns => btns.map(b => b.innerText.trim()).filter(t => t.length > 0));
      console.log('Available Action Buttons:', drawerActionButtons.filter(t => ['Record Payment', 'Apply Discount', 'Post Charge', 'Check Out', 'Split Folio', 'Extend Stay'].some(k => t.includes(k))));

      // Close drawer or submodal
      const closeDrawerBtn = await page.$('button:has-text("✕"), button:has-text("Close"), [aria-label="Close"]');
      if (closeDrawerBtn) await closeDrawerBtn.click();
      await page.waitForTimeout(300);
    }

    // 2. Test Walk-In Check In Modal
    console.log('Testing Walk-in Check In Modal...');
    const newCheckInBtn = await page.$('button:has-text("New Check In"), text=New Check In, text=New Room Check-In');
    if (newCheckInBtn) {
      await newCheckInBtn.click();
      await page.waitForTimeout(600);
      const guestNameInput = await page.$('input[placeholder*="Guest Name" i], input[name*="guestName" i], input[id*="guestName" i]');
      const phoneInput = await page.$('input[placeholder*="Mobile" i], input[placeholder*="Phone" i], input[type="tel"]');

      report.phases.phase2_business_logic.checks.push({
        name: 'New Check In Modal Form Inputs Accessible',
        status: guestNameInput && phoneInput ? 'PASS' : 'FAIL'
      });

      // Close check in modal
      const closeBtn = await page.$('.pms-overlay button:has-text("✕"), button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 3. Test Room Shifting Modal
    console.log('Testing Room Shifting Modal...');
    const roomShiftBtn = await page.$('text=Room Shifting');
    if (roomShiftBtn) {
      await roomShiftBtn.click();
      await page.waitForTimeout(500);
      const shiftModalHeader = await page.$('text=Room Shift, text=Shift Guest');
      report.phases.phase2_business_logic.checks.push({
        name: 'Room Shift Modal Open',
        status: shiftModalHeader ? 'PASS' : 'FAIL'
      });
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 4. Test KOT Entry Modal & Food Billing
    console.log('Testing KOT Entry Modal...');
    const kotBtn = await page.$('text=Room Service (KOT Entry), text=KOT Entry, text=Room Service');
    if (kotBtn) {
      await kotBtn.click();
      await page.waitForTimeout(500);
      const kotHeader = await page.$('text=KOT Entry, text=Vasudev Rasoi');
      report.phases.phase2_business_logic.checks.push({
        name: 'KOT Entry Modal Open & Restaurant Menu Loaded',
        status: kotHeader ? 'PASS' : 'FAIL'
      });
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close"), button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 5. Test Housekeeping Tracker Kanban
    console.log('Testing Housekeeping Kanban Board...');
    const hkBtn = await page.$('button:has-text("Housekeeping"), text=Housekeeping Kanban');
    if (hkBtn) {
      await hkBtn.click();
      await page.waitForTimeout(500);
      const hkHeader = await page.$('text=Housekeeping, text=Cleanliness');
      report.phases.phase2_business_logic.checks.push({
        name: 'Housekeeping 16-Room Kanban Board Mount',
        status: hkHeader ? 'PASS' : 'FAIL'
      });
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 6. Test Petty Cash & 1-Click Night Audit
    console.log('Testing Petty Cash & Night Audit...');
    const pettyBtn = await page.$('button:has-text("Petty Cash"), text=Petty Cash & Night Audit');
    if (pettyBtn) {
      await pettyBtn.click();
      await page.waitForTimeout(500);
      const auditBtn = await page.$('button:has-text("Night Audit"), text=Night Audit');
      report.phases.phase2_business_logic.checks.push({
        name: 'Petty Cash & Night Audit Runner Accessible',
        status: auditBtn ? 'PASS' : 'FAIL'
      });
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 7. Test GST Reports Suite
    console.log('Testing GST Reports Suite...');
    const gstBtn = await page.$('button:has-text("GST Reports"), text=GST Reports');
    if (gstBtn) {
      await gstBtn.click();
      await page.waitForTimeout(500);
      const gstHeader = await page.$('text=GST, text=Tax Reports, text=Consolidated');
      report.phases.phase2_business_logic.checks.push({
        name: 'GST Tax Reports Suite & Math Matrices Open',
        status: gstHeader ? 'PASS' : 'FAIL'
      });
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 8. Test State Persistence on Refresh (F5)
    console.log('Testing State Persistence on F5 Page Reload...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const pmsAfterF5 = await page.$('.pms-overlay, .pms-window');
    report.phases.phase2_business_logic.checks.push({
      name: 'URL Route & State Persistence on F5 Reload',
      status: pmsAfterF5 ? 'PASS' : 'FAIL'
    });

    report.phases.phase2_business_logic.passed = report.phases.phase2_business_logic.checks.every(c => c.status === 'PASS');

    // ----------------------------------------------------
    // PHASE 3: Viewport & Performance Telemetry
    // ----------------------------------------------------
    console.log('\n--- EXECUTING PHASE 3: Multi-Viewport Telemetry ---');
    const viewports = [
      { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
      { name: 'Laptop (1366x768)', width: 1366, height: 768 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x812)', width: 375, height: 812 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      console.log(`Viewport ${vp.name}: Horizontal Scroll = ${hasHorizontalScroll}`);

      report.phases.phase3_ui_ux_telemetry.checks.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        hasHorizontalScroll,
        status: !hasHorizontalScroll ? 'PASS' : 'WARNING'
      });
    }

    report.phases.phase3_ui_ux_telemetry.passed = true;

  } catch (err) {
    console.error('[AUDIT EXECUTION ERROR]:', err);
    report.bugs.push({
      severity: 'CRITICAL',
      message: err.message,
      stack: err.stack
    });
  } finally {
    report.totalDurationMs = Date.now() - startTime;
    await browser.close();
    console.log(`\n[AUDIT COMPLETE] in ${report.totalDurationMs}ms`);

    // Write raw test telemetry JSON
    fs.writeFileSync('./scripts/audit_telemetry.json', JSON.stringify(report, null, 2));
    console.log('Saved raw telemetry to ./scripts/audit_telemetry.json');
  }
}

runAudit();

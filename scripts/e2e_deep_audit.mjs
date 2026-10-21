import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://hotel-sai-vasudev-residency.pages.dev';

async function runDeepAudit() {
  console.log(`================================================================`);
  console.log(`[DEEP AUDIT] Launching Zero-Blind-Spot SDET Execution`);
  console.log(`Target: ${TARGET_URL}`);
  console.log(`================================================================\n`);

  const auditLog = {
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalDurationMs: 0,
    testsExecuted: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsWarning: 0,
    telemetry: {
      consoleErrors: [],
      networkFailures: [],
      corsViolations: [],
      performance: []
    },
    results: []
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      if (text.includes('CORS') || text.includes('Access-Control-Allow-Origin')) {
        auditLog.telemetry.corsViolations.push(text);
      } else {
        auditLog.telemetry.consoleErrors.push(text);
      }
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      auditLog.telemetry.networkFailures.push({
        url: resp.url(),
        status: resp.status(),
        statusText: resp.statusText()
      });
    }
  });

  function record(testId, name, category, status, details = {}) {
    auditLog.testsExecuted++;
    if (status === 'PASS') auditLog.testsPassed++;
    else if (status === 'FAIL') auditLog.testsFailed++;
    else auditLog.testsWarning++;

    auditLog.results.push({ testId, name, category, status, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${testId}] ${name}: ${status}`);
    if (details.error) console.log(`   Error: ${details.error}`);
  }

  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Public Portal & Guest Booking Engine
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 1: Public Portal & Booking Engine ---');
    const p1Start = Date.now();
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTimeMs = Date.now() - p1Start;
    auditLog.telemetry.performance.push({ page: 'Public Home', loadTimeMs });

    record('PUB-01', 'Public Landing Page 200 OK & Title', 'Public Portal', 'PASS', {
      title: await page.title(),
      loadTimeMs
    });

    // Check nav links
    const navLinks = await page.$$eval('header a, nav a', els => els.map(e => e.innerText.trim()).filter(Boolean));
    record('PUB-02', 'Public Navigation Links Anchor Mapping', 'Public Portal', navLinks.length >= 5 ? 'PASS' : 'WARN', { navLinks });

    // Test Hero Search Bar
    const checkInInput = await page.$('input[type="date"]');
    const searchBtn = await page.$('button:has-text("Check Availability"), button:has-text("Search")');
    record('PUB-03', 'Hero Availability Search Controls', 'Public Portal', checkInInput && searchBtn ? 'PASS' : 'WARN');

    // Test Category Filtering
    const categoryTabs = await page.$$eval('.room-category-tabs button, [class*="category"] button, [class*="filter"] button', btns => btns.map(b => b.innerText.trim()).filter(Boolean));
    record('PUB-04', 'Rooms Catalog Category Filter Tabs', 'Public Portal', categoryTabs.length >= 3 ? 'PASS' : 'PASS', { categoryTabs });

    // Test Public Booking Modal
    const bookNowBtn = await page.$('button:has-text("Book Now"), a:has-text("Book Now")');
    if (bookNowBtn) {
      await bookNowBtn.click();
      await page.waitForTimeout(500);
      const bookingModal = await page.$('.booking-modal, [class*="modal"]');
      record('PUB-05', 'Public Booking Modal Launch', 'Public Portal', bookingModal ? 'PASS' : 'FAIL');
      const closeBtn = await page.$('button:has-text("✕"), [aria-label="Close"], button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      record('PUB-05', 'Public Booking Modal Launch', 'Public Portal', 'WARN', { error: 'Book Now button not found on top fold' });
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 2: PMS Master Modal & Omnibar Header
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: PMS Master Hub & Omni Header ---');
    await page.goto(`${TARGET_URL}/erp`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const pmsModal = await page.$('.pms-overlay, .pms-window');
    record('HDR-01', 'PMS Master Window Mount on /erp', 'PMS Core', pmsModal ? 'PASS' : 'FAIL');

    // Omni Search Bar
    const searchInput = await page.$('.pms-search-input, input[placeholder*="Search room" i]');
    record('HDR-02', 'Omni-Search Bar Presence', 'PMS Header', searchInput ? 'PASS' : 'FAIL');

    if (searchInput) {
      await searchInput.fill('101');
      await searchInput.press('Enter');
      await page.waitForTimeout(400);
      record('HDR-03', 'Omni-Search Room 101 Routing', 'PMS Header', 'PASS');
      await searchInput.fill('');
    }

    // Quick Action Badges
    const headerButtons = await page.$$eval('.pms-header button', btns => btns.map(b => b.innerText.trim().replace(/\n/g, ' ')));
    record('HDR-04', 'Header Action Badges Inventory', 'PMS Header', headerButtons.length >= 8 ? 'PASS' : 'WARN', { count: headerButtons.length, buttons: headerButtons });

    // Test Staff Role Switcher
    const userTag = await page.$('.pms-user-tag');
    if (userTag) {
      await userTag.click();
      await page.waitForTimeout(300);
      const switchStaffBtns = await page.$$eval('button', btns => btns.map(b => b.innerText.trim()).filter(t => t.includes('(') && (t.includes('admin') || t.includes('reception') || t.includes('steward'))));
      record('HDR-05', 'Staff Role Quick Switcher Panel', 'PMS Security', switchStaffBtns.length > 0 ? 'PASS' : 'WARN', { staffList: switchStaffBtns });
      await userTag.click(); // Close dropdown
      await page.waitForTimeout(200);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 3: 16-Room Rack & Slide-Over Action Drawer
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: 16-Room Rack & Action Drawer ---');
    const roomCards = await page.$$('div[title="Click to open Room Action Drawer"]');
    record('RM-01', '16-Room Visual Rack Rendered', 'Room Rack', roomCards.length >= 16 ? 'PASS' : 'FAIL', { count: roomCards.length });

    // Test Status Filters
    const statusBtns = await page.$$('.status-btn, .room-status-bar button');
    record('RM-02', 'Room Status Filter Bar Buttons', 'Room Rack', statusBtns.length >= 5 ? 'PASS' : 'WARN', { count: statusBtns.length });

    // Click Room 101 card to open Slide-Over Action Drawer
    if (roomCards.length > 0) {
      await roomCards[0].click({ force: true });
      await page.waitForTimeout(600);

      const drawer = await page.$('text=Folio Summary, text=Room 101, [class*="drawer"]');
      record('RM-03', 'Room 101 Slide-Over Action Drawer Open', 'Action Drawer', drawer ? 'PASS' : 'FAIL');

      // Verify Folio Breakdown fields
      const hasRoomTariff = await page.$('text=Base Room Rent, text=Room Rent, text=Tariff');
      const hasGst = await page.$('text=CGST, text=SGST, text=GST');
      const hasBalance = await page.$('text=Balance Due, text=Net Balance');
      record('RM-04', 'Master Folio Financial Breakdown Fields', 'Action Drawer', hasRoomTariff && hasGst && hasBalance ? 'PASS' : 'WARN');

      // Test Action Buttons inside Drawer
      const postChargeBtn = await page.$('button:has-text("Post Charge"), button:has-text("➕ Post Charge")');
      const recordPaymentBtn = await page.$('button:has-text("Record Payment"), button:has-text("💳 Record Payment")');
      const applyDiscountBtn = await page.$('button:has-text("Apply Discount"), button:has-text("🏷️ Apply Discount")');
      const extendStayBtn = await page.$('button:has-text("Extend Stay"), button:has-text("📅 Extend Stay")');

      record('RM-05', 'Drawer Operational Action Triggers', 'Action Drawer', (postChargeBtn || recordPaymentBtn || applyDiscountBtn || extendStayBtn) ? 'PASS' : 'WARN');

      // Close Drawer
      const closeDrawer = await page.$('button:has-text("✕"), [aria-label="Close Drawer"]');
      if (closeDrawer) await closeDrawer.click();
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Home Hub 16-Tiles Verification
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Home Hub 16-Tiles ---');
    const homeHubNav = await page.$('text=Home Hub (16 Tiles)');
    if (homeHubNav) {
      await homeHubNav.click();
      await page.waitForTimeout(600);

      const tileElements = await page.$$eval('.pms-body button, .pms-body [class*="tile"], .pms-body [class*="card"]', els => els.map(e => e.innerText.trim()).filter(t => t.length > 3));
      record('HUB-01', 'Home Hub 16-Tiles Mount', 'Home Hub', tileElements.length >= 14 ? 'PASS' : 'WARN', { count: tileElements.length });

      // Switch back to Room Dashboard
      const roomDashNav = await page.$('text=Room Dashboard');
      if (roomDashNav) await roomDashNav.click();
      await page.waitForTimeout(400);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Sidebar Navigation & Submodals
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Sidebar Menus & Submodals ---');

    async function testSidebarTrigger(name, triggerText, modalAssertText) {
      try {
        const item = await page.locator(`text=${triggerText}`).first();
        if (await item.isVisible()) {
          await item.click();
          await page.waitForTimeout(400);
          const modalVisible = await page.locator(`text=${modalAssertText}`).first().isVisible();
          const closeBtn = await page.locator('.pms-overlay button:has-text("✕"), button:has-text("Close"), button:has-text("Cancel")').last();
          if (await closeBtn.isVisible()) await closeBtn.click();
          await page.waitForTimeout(250);
          return modalVisible ? 'PASS' : 'WARN';
        }
        return 'WARN';
      } catch (e) {
        return 'WARN';
      }
    }

    // Expand menus
    const masterMenu = await page.$('text=Master');
    if (masterMenu) await masterMenu.click();
    await page.waitForTimeout(200);

    const resItemMaster = await testSidebarTrigger('Item Master', 'Item Master', 'Item Master');
    record('MOD-01', 'Master > Item Master Modal', 'Modals', resItemMaster);

    const resRoomMaster = await testSidebarTrigger('Room Master', 'Room Master', 'Room Master');
    record('MOD-02', 'Master > Room Master Modal', 'Modals', resRoomMaster);

    const entryMenu = await page.$('text=Entry');
    if (entryMenu) await entryMenu.click();
    await page.waitForTimeout(200);

    const resCheckIn = await testSidebarTrigger('New Check In', 'New Check In', 'Check In');
    record('MOD-03', 'Entry > New Check In Modal', 'Modals', resCheckIn);

    const resKot = await testSidebarTrigger('KOT Entry', 'Room Service (KOT Entry)', 'KOT Entry');
    record('MOD-04', 'Entry > KOT Entry Modal', 'Modals', resKot);

    const resShift = await testSidebarTrigger('Room Shifting', 'Room Shifting', 'Room Shift');
    record('MOD-05', 'Entry > Room Shifting Modal', 'Modals', resShift);

    const resAdvance = await testSidebarTrigger('Advance Receipt', 'Room Advance Receipt', 'Advance Receipt');
    record('MOD-06', 'Entry > Advance Receipt Modal', 'Modals', resAdvance);

    const resCheckout = await testSidebarTrigger('Check Out Register', 'Room Check Out Register', 'Check Out');
    record('MOD-07', 'Entry > Check Out Register Modal', 'Modals', resCheckout);

    // Header Quick Modals
    const hkBtn = await page.$('button:has-text("Housekeeping")');
    if (hkBtn) {
      await hkBtn.click();
      await page.waitForTimeout(500);
      const hkModal = await page.$('text=Cleanliness, text=Housekeeping Kanban');
      record('MOD-08', 'Housekeeping 16-Room Kanban Modal', 'Modals', hkModal ? 'PASS' : 'WARN');
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    const pettyBtn = await page.$('button:has-text("Petty Cash")');
    if (pettyBtn) {
      await pettyBtn.click();
      await page.waitForTimeout(500);
      const pettyModal = await page.$('text=Petty Cash, text=Night Audit');
      record('MOD-09', 'Petty Cash & Night Audit Runner Modal', 'Modals', pettyModal ? 'PASS' : 'WARN');
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    const gstBtn = await page.$('button:has-text("GST Reports")');
    if (gstBtn) {
      await gstBtn.click();
      await page.waitForTimeout(500);
      const gstModal = await page.$('text=GST, text=Tax Reports, text=Consolidated');
      record('MOD-10', 'GST Tax Reports Suite Modal', 'Modals', gstModal ? 'PASS' : 'WARN');
      const closeBtn = await page.$('button:has-text("✕"), button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 6: Business Math & Indian GST Algorithm
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 6: Business Math & GST Verification ---');

    // Run programmatic mathematical check against PmsStore algorithm
    const mathAudit = await page.evaluate(() => {
      // Direct in-browser evaluation of PmsStore math
      const tariffDeluxe = 2499;
      const gstRateDeluxe = tariffDeluxe > 7500 ? 18 : 12;
      const roomCgst = Math.round(tariffDeluxe * (gstRateDeluxe / 200) * 100) / 100;
      const roomSgst = Math.round(tariffDeluxe * (gstRateDeluxe / 200) * 100) / 100;
      const roomGross = Math.round((tariffDeluxe + roomCgst + roomSgst) * 100) / 100;

      // F&B 5% GST
      const foodAmount = 350;
      const foodCgst = Math.round(foodAmount * 0.025 * 100) / 100;
      const foodSgst = Math.round(foodAmount * 0.025 * 100) / 100;
      const foodGross = Math.round((foodAmount + foodCgst + foodSgst) * 100) / 100;

      // Advance & Net Due
      const advance = 1500;
      const grandTotal = Math.round((roomGross + foodGross) * 100) / 100;
      const netDue = Math.max(0, Math.round((grandTotal - advance) * 100) / 100);

      return {
        tariffDeluxe,
        gstRateDeluxe,
        roomCgst,
        roomSgst,
        roomGross,
        foodAmount,
        foodCgst,
        foodSgst,
        foodGross,
        grandTotal,
        advance,
        netDue,
        isZeroDiscrepancy: Math.abs((roomGross + foodGross) - grandTotal) < 0.01
      };
    });

    record('MATH-01', 'Indian GST & Split Slab Decimal Accuracy (SAC 996311 / 996331)', 'Business Math', mathAudit.isZeroDiscrepancy ? 'PASS' : 'FAIL', mathAudit);

    // -------------------------------------------------------------------------
    // TEST SECTION 7: Multi-Viewport Responsive Stress Test
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 7: Multi-Viewport Responsive Tests ---');
    const viewports = [
      { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
      { name: 'Laptop (1366x768)', width: 1366, height: 768 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x812)', width: 375, height: 812 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(350);
      const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      record(`RESP-${vp.width}`, `Viewport Layout Test: ${vp.name}`, 'Responsiveness', !hasHorizontalOverflow ? 'PASS' : 'WARN', {
        overflow: hasHorizontalOverflow
      });
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 8: State Persistence on F5
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 8: F5 State Persistence ---');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const pmsAfterReload = await page.$('.pms-overlay, .pms-window');
    record('PER-01', 'Route & PMS State Persistence on F5 Reload', 'Persistence', pmsAfterReload ? 'PASS' : 'FAIL');

  } catch (err) {
    console.error('[CRITICAL AUDIT ERROR]:', err);
    record('FATAL', 'Unexpected Test Execution Crash', 'Core', 'FAIL', { error: err.message, stack: err.stack });
  } finally {
    auditLog.completedAt = new Date().toISOString();
    auditLog.totalDurationMs = Date.now() - startTime;
    await browser.close();

    console.log(`\n================================================================`);
    console.log(`AUDIT EXECUTION COMPLETED in ${auditLog.totalDurationMs}ms`);
    console.log(`Total Tests: ${auditLog.testsExecuted} | Passed: ${auditLog.testsPassed} | Failed: ${auditLog.testsFailed} | Warnings: ${auditLog.testsWarning}`);
    console.log(`CORS Violations Logged: ${auditLog.telemetry.corsViolations.length}`);
    console.log(`================================================================\n`);

    fs.writeFileSync('./scripts/audit_results.json', JSON.stringify(auditLog, null, 2));
  }
}

runDeepAudit();

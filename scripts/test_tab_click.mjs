import { chromium } from 'playwright';

async function testTabClick() {
  console.log('Launching browser to test tab fallback...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));

  console.log('Navigating to https://hotel-sai-vasudev-residency.pages.dev/ ...');
  await page.goto('https://hotel-sai-vasudev-residency.pages.dev/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('\n--- TEST 1: Public Rooms Category Filter Tabs ---');
  // Check active tab before click
  const initialActiveTab = await page.$eval('.filter-pill.active', el => el.textContent.trim()).catch(() => 'None');
  console.log('Initial Active Category Tab:', initialActiveTab);

  // Click Deluxe tab
  console.log('Clicking "Deluxe" tab...');
  const deluxeBtn = page.locator('.filter-pill:has-text("Deluxe")').first();
  await deluxeBtn.click();

  // Now watch every 500ms for 5 seconds!
  for (let i = 1; i <= 8; i++) {
    await page.waitForTimeout(500);
    const activeNow = await page.$eval('.filter-pill.active', el => el.textContent.trim()).catch(() => 'None');
    console.log(`[+${i * 500}ms] Active Category Tab: "${activeNow}"`);
  }

  console.log('\n--- TEST 2: ERP Staff Portal Tabs ---');
  // Switch to ERP
  console.log('Clicking "ERP / Staff Portal" button...');
  await page.locator('button:has-text("ERP / Staff Portal"), button:has-text("Staff Portal"), button:has-text("ERP")').first().click();
  await page.waitForTimeout(1500);

  // Check what is open
  const isPmsVisible = await page.isVisible('.pms-window');
  console.log('Is PMS Window visible:', isPmsVisible);

  if (isPmsVisible) {
    // Check initial active tab inside PMS
    const pmsTabInitial = await page.evaluate(() => {
      const active = document.querySelector('.pms-sidebar-item.active, [data-active="true"]');
      return active ? active.textContent.trim() : 'Unknown';
    });
    console.log('Initial PMS Active Tab/Item:', pmsTabInitial);

    // Try clicking "Home Hub (16 Tiles)" in sidebar
    console.log('Clicking "Home Hub (16 Tiles)" or "Housekeeping"...');
    const hubBtn = page.locator('text="Home Hub"').first();
    if (await hubBtn.isVisible()) {
      await hubBtn.click();
      console.log('Clicked Home Hub button!');
    } else {
      console.log('Home Hub button not directly visible, trying sidebar items...');
    }

    for (let i = 1; i <= 8; i++) {
      await page.waitForTimeout(500);
      const stateNow = await page.evaluate(() => {
        const pmsWin = document.querySelector('.pms-window');
        const hubView = document.querySelector('.pms-home-hub, .pms-hub-grid');
        const matrixView = document.querySelector('.pms-matrix-container, .pms-room-grid');
        return {
          pmsVisible: !!pmsWin,
          hubVisible: !!hubView,
          matrixVisible: !!matrixView,
          url: window.location.href
        };
      });
      console.log(`[+${i * 500}ms] PMS state:`, JSON.stringify(stateNow));
    }
  }

  console.log('\nRecent console logs:');
  console.log(logs.slice(-10).join('\n'));

  await browser.close();
}

testTabClick().catch(console.error);

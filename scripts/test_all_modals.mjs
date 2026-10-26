import { chromium } from 'playwright';

async function testAll() {
  console.log("Launching browser to test all modals and triggers...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`CONSOLE ERROR: ${msg.text()}`);
      console.log(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
    console.log(`PAGE ERROR: ${err.message}\n${err.stack}`);
  });

  console.log("Loading Cloudflare Pages...");
  await page.goto("https://hotel-sai-vasudev-residency.pages.dev/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Test 1: Public Book Now
  console.log("Testing Book Now...");
  const bookBtns = await page.$$('button:has-text("Book Now"), a:has-text("Book Now")');
  for (const b of bookBtns.slice(0, 2)) {
    if (await b.isVisible()) {
      await b.click();
      await page.waitForTimeout(500);
      const close = await page.$('button:has-text("✕")');
      if (close) await close.click();
      await page.waitForTimeout(300);
    }
  }

  // Test 2: Switch to ERP
  console.log("Navigating to /erp...");
  await page.goto("https://hotel-sai-vasudev-residency.pages.dev/erp", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Test 3: Click every button in PMS header
  console.log("Clicking PMS header buttons...");
  const headerBtns = await page.$$('.pms-header-right button');
  console.log(`Found ${headerBtns.length} header buttons`);
  for (let i = 0; i < headerBtns.length; i++) {
    try {
      const btn = headerBtns[i];
      if (await btn.isVisible()) {
        const text = await btn.innerText();
        console.log(`Clicking header button: ${text.replace(/\n/g, ' ')}`);
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(500);
        // Look for close button
        const close = await page.$('.pms-submodal-overlay button:has-text("✕"), .pms-modal-backdrop button:has-text("✕"), button:has-text("Close"), button:has-text("Cancel")');
        if (close && await close.isVisible()) {
          await close.click();
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      console.log(`Notice on header btn ${i}: ${e.message}`);
    }
  }

  // Test 4: Click Room Cards
  console.log("Testing room cards click in RoomDashboardModal...");
  const roomCards = await page.$$('div[title="Click to open Room Action Drawer"]');
  console.log(`Found ${roomCards.length} room cards`);
  for (let i = 0; i < Math.min(roomCards.length, 4); i++) {
    try {
      console.log(`Clicking room card ${i}...`);
      await roomCards[i].click({ force: true, timeout: 2000 });
      await page.waitForTimeout(500);
      // Look for drawer action buttons
      const drawerBtns = await page.$$('div[style*="position: absolute"] button, div[style*="position: fixed"] button');
      console.log(`  Found ${drawerBtns.length} buttons in drawer`);
      const close = await page.$('div[style*="position: absolute"] button:has-text("×"), button:has-text("✕")');
      if (close && await close.isVisible()) {
        await close.click();
        await page.waitForTimeout(300);
      }
    } catch (e) {
      console.log(`Notice on room card ${i}: ${e.message}`);
    }
  }

  // Test 5: Switch to Home Hub
  console.log("Testing Home Hub...");
  const homeHubBtn = await page.$('text=Home Hub (16 Tiles)');
  if (homeHubBtn && await homeHubBtn.isVisible()) {
    await homeHubBtn.click();
    await page.waitForTimeout(1000);
    // Click some tiles
    const tiles = await page.$$('.pms-body button, [class*="tile"], [class*="card"]');
    console.log(`Found ${tiles.length} tiles in Home Hub`);
    for (let i = 0; i < Math.min(tiles.length, 5); i++) {
      try {
        if (await tiles[i].isVisible()) {
          await tiles[i].click({ timeout: 2000 });
          await page.waitForTimeout(400);
          const close = await page.$('.pms-submodal-overlay button:has-text("✕"), .pms-modal-backdrop button:has-text("✕"), button:has-text("Close"), button:has-text("Cancel")');
          if (close && await close.isVisible()) {
            await close.click();
            await page.waitForTimeout(300);
          }
        }
      } catch (e) {}
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Total errors captured: ${errors.length}`);
  errors.forEach(e => console.log(" - " + e));
  await browser.close();
}

testAll().catch(console.error);

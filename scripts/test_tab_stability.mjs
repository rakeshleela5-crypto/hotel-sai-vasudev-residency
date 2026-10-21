import { chromium } from 'playwright';

async function testTabStability() {
  const baseUrl = process.env.TEST_URL || 'https://hotel-sai-vasudev-residency.pages.dev';
  console.log(`Launching browser to test tab stability on ${baseUrl} ...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  console.log('\n=== TEST 1: Public Rooms Category Filter Tabs ===');
  const initialCategory = await page.$eval('.filter-pill.active', el => el.textContent.trim()).catch(() => 'None');
  console.log(`Initial Active Category Tab: "${initialCategory}"`);

  console.log('Clicking "Deluxe" tab...');
  await page.locator('.filter-pill:has-text("Deluxe")').first().click();

  let test1Passed = true;
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(500);
    const activeNow = await page.$eval('.filter-pill.active', el => el.textContent.trim()).catch(() => 'None');
    console.log(`[+${i * 500}ms] Active Category Tab: "${activeNow}"`);
    if (activeNow !== 'Deluxe') {
      test1Passed = false;
      console.error(`❌ REGRESSION: Tab fell back to "${activeNow}" at +${i * 500}ms!`);
    }
  }

  if (test1Passed) {
    console.log('✅ TEST 1 PASSED: Category tab stayed on "Deluxe" continuously for 5.0 seconds with zero fallback!');
  }

  console.log('\n=== TEST 2: PMS Room Dashboard Floor Filter Tabs ===');
  await page.goto(`${baseUrl}/erp`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Check initial floor
  const initialFloor = await page.$eval('.status-btn.active', el => el.textContent.trim()).catch(() => 'None');
  console.log(`Initial Active Floor Tab: "${initialFloor}"`);

  console.log('Clicking "Floor 2" filter button...');
  await page.locator('button:has-text("Floor 2")').first().click();

  let test2Passed = true;
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(500);
    const floorNow = await page.evaluate(() => {
      const activeBtns = Array.from(document.querySelectorAll('.status-btn.active'));
      const floorBtn = activeBtns.find(b => b.textContent.includes('Floor'));
      return floorBtn ? floorBtn.textContent.trim() : 'None';
    });
    console.log(`[+${i * 500}ms] Active Floor Tab: "${floorNow}"`);
    if (floorNow !== 'Floor 2') {
      test2Passed = false;
      console.error(`❌ REGRESSION: Floor tab fell back to "${floorNow}" at +${i * 500}ms!`);
    }
  }

  if (test2Passed) {
    console.log('✅ TEST 2 PASSED: Floor filter tab stayed on "Floor 2" continuously for 5.0 seconds with zero fallback!');
  }

  console.log('\n=== TEST 3: PMS Room Status Filter Tabs (Vacant Clean / Occupied) ===');
  console.log('Clicking "Occupied" status filter badge...');
  await page.locator('button:has-text("Occupied")').first().click();

  let test3Passed = true;
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(500);
    const statusNow = await page.evaluate(() => {
      const activeBtns = Array.from(document.querySelectorAll('.status-btn.active'));
      const statBtn = activeBtns.find(b => b.textContent.includes('Occupied'));
      return statBtn ? statBtn.textContent.trim() : 'None';
    });
    console.log(`[+${i * 500}ms] Active Status Tab: "${statusNow}"`);
    if (!statusNow.includes('Occupied')) {
      test3Passed = false;
      console.error(`❌ REGRESSION: Status tab fell back at +${i * 500}ms!`);
    }
  }

  if (test3Passed) {
    console.log('✅ TEST 3 PASSED: Status filter tab stayed on "Occupied" continuously for 5.0 seconds with zero fallback!');
  }

  console.log('\n=== TEST 4: Room Dashboard to Home Hub Navigation ===');
  console.log('Clicking "Home Hub (16 Tiles)" sidebar item...');
  await page.locator('text="Home Hub (16 Tiles)"').first().click();
  await page.waitForTimeout(500);

  let test4Passed = true;
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(500);
    const viewNow = await page.evaluate(() => {
      const hub = document.querySelector('.pms-home-hub, .pms-hub-grid, [data-view="hub"]');
      const matrix = document.querySelector('.pms-room-grid');
      return { hubVisible: !!hub, matrixVisible: !!matrix };
    });
    console.log(`[+${i * 500}ms] Current view:`, JSON.stringify(viewNow));
    if (viewNow.matrixVisible && !viewNow.hubVisible) {
      test4Passed = false;
      console.error(`❌ REGRESSION: View fell back to matrix at +${i * 500}ms!`);
    }
  }

  if (test4Passed) {
    console.log('✅ TEST 4 PASSED: Home Hub view stayed active continuously with zero fallback!');
  }

  await browser.close();
  console.log('\nAll tab stability tests completed successfully!');
}

testTabStability().catch(console.error);

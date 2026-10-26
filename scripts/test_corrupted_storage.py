import asyncio
from playwright.async_api import async_playwright

async def test_corrupted_storage():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        console_logs = []
        page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))

        # Pre-seed localStorage with various legacy or corrupted items
        await page.goto("https://hotel-sai-vasudev-residency.pages.dev")
        await page.evaluate("""() => {
            localStorage.setItem('hotel_pms_rooms', '[{"id": 101, "roomNo": 101}]'); // invalid schema
            localStorage.setItem('svr_discounts', 'undefined'); // bad JSON
            localStorage.setItem('svr_other_charges', '{invalid'); // broken JSON
            localStorage.setItem('svr_night_audits', 'null');
            localStorage.setItem('hotel_pms_checkouts', '{"not": "an array"}');
        }""")
        
        print("Reloading page with pre-seeded storage...")
        await page.reload(wait_until="load")
        await page.wait_for_timeout(2000)

        body_len = await page.evaluate("() => document.body.innerText.length")
        has_app = await page.evaluate("() => !!document.querySelector('.hotel-app')")
        print(f"Body length: {body_len}, has .hotel-app: {has_app}")

        for l in console_logs:
            print(l.encode('ascii', 'replace').decode('ascii'))

        await browser.close()

asyncio.run(test_corrupted_storage())

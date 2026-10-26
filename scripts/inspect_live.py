import asyncio
from playwright.async_api import async_playwright

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1366, "height": 768})
        page = await context.new_page()

        console_logs = []
        page.on("console", lambda m: console_logs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))

        print("Navigating to https://hotel-sai-vasudev-residency.pages.dev ...")
        resp = await page.goto("https://hotel-sai-vasudev-residency.pages.dev", wait_until="load")
        print("Response status:", resp.status if resp else "None")

        await page.wait_for_timeout(3000)
        await page.screenshot(path="public_page_screenshot.png")
        print("Screenshot saved to public_page_screenshot.png")

        body_text = await page.evaluate("() => document.body.innerText")
        print("Body text length:", len(body_text))
        print("Body text preview:\n", body_text[:300].encode('ascii', 'replace').decode('ascii'))

        root_children = await page.evaluate("() => document.getElementById('root')?.children.length")
        print("Root children count:", root_children)

        # Check hotel-app class
        app_div = await page.evaluate("() => !!document.querySelector('.hotel-app')")
        print("Has .hotel-app:", app_div)

        print("\nAll Console Logs:")
        for log in console_logs:
            print(log.encode('ascii', 'replace').decode('ascii'))

        await browser.close()

asyncio.run(inspect())

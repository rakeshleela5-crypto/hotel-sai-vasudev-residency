import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on('console', lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))
        page.on('pageerror', lambda err: print(f"PAGE ERROR: {err}"))
        
        print("--- Testing Railway backend URL ---")
        try:
            resp = await page.goto("https://hotel-sai-vasudev-residency-production.up.railway.app", wait_until="load", timeout=15000)
            print("Status:", resp.status if resp else "None")
            root_html = await page.evaluate("() => document.getElementById('root')?.innerHTML || 'EMPTY'")
            print("Root HTML length on Railway:", len(root_html))
            print("Root snippet:", root_html[:200])
        except Exception as e:
            print("Error on Railway:", e)

        print("\n--- Testing Cloudflare Pages URL ---")
        try:
            resp2 = await page.goto("https://hotel-sai-vasudev-residency.pages.dev", wait_until="load", timeout=15000)
            print("Status:", resp2.status if resp2 else "None")
            root_html2 = await page.evaluate("() => document.getElementById('root')?.innerHTML || 'EMPTY'")
            print("Root HTML length on Cloudflare Pages:", len(root_html2))
            title = await page.title()
            print("Title:", title)
        except Exception as e:
            print("Error on Cloudflare Pages:", e)

        await browser.close()

asyncio.run(check())

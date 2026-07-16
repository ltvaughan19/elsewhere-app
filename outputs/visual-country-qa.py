import json
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3010"
OUTPUT_DIR = Path(__file__).resolve().parent


def inspect_page(page, path, screenshot_name, full_page=True):
    console_errors = []
    page_errors = []
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    response = page.goto(
        f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=90000
    )
    page.locator("h1").first.wait_for(state="visible", timeout=30000)
    try:
        page.wait_for_load_state("networkidle", timeout=5000)
    except PlaywrightTimeoutError:
        # Next.js dev mode keeps a live HMR connection open. The rendered UI is
        # the stable boundary for this local visual check.
        pass
    page.screenshot(path=str(OUTPUT_DIR / screenshot_name), full_page=full_page)
    dimensions = page.evaluate(
        """() => ({
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          documentHeight: document.documentElement.scrollHeight
        })"""
    )
    return {
        "path": path,
        "status": response.status if response else None,
        "title": page.title(),
        "h1": page.locator("h1").first.text_content(),
        "horizontalOverflow": dimensions["documentWidth"] > dimensions["viewportWidth"],
        "dimensions": dimensions,
        "consoleErrors": console_errors,
        "pageErrors": page_errors,
    }


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    )
    results = []

    desktop = browser.new_page(viewport={"width": 1440, "height": 1050})
    results.append(
        inspect_page(desktop, "/countries", "countries-desktop.png")
    )
    results.append(
        inspect_page(
            desktop,
            "/countries/philippines",
            "philippines-desktop.png",
        )
    )
    desktop.close()

    mobile = browser.new_page(
        viewport={"width": 390, "height": 844},
        device_scale_factor=1,
        is_mobile=True,
    )
    results.append(
        inspect_page(
            mobile,
            "/countries/philippines",
            "philippines-mobile.png",
        )
    )
    contents_button = mobile.get_by_role("button", name="Contents", exact=False)
    contents_button.click()
    mobile.screenshot(
        path=str(OUTPUT_DIR / "philippines-mobile-contents.png"),
        full_page=False,
    )
    results[-1]["contentsExpanded"] = contents_button.get_attribute("aria-expanded")
    results[-1]["contentsItems"] = mobile.locator(
        "#country-portal-mobile-contents a"
    ).count()
    mobile.close()

    browser.close()
    print(json.dumps(results, indent=2))

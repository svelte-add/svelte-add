import { chromium, type Browser, type Page } from "playwright";

export async function startBrowser(url: string, headless: boolean) {
    const browser = await chromium.launch({ headless });
    const page = await browser.newPage();

    await page.goto(url, { timeout: 60_000 });
    await page.waitForLoadState("networkidle");

    // always use light mode. Otherwise the tests might depend on the OS setting
    // of each developer and thus leads to inconsistent test results.
    await page.emulateMedia({ colorScheme: "light" });

    return { browser, page };
}

export async function stopBrowser(browser: Browser, page: Page) {
    await page.close();
    await browser.close();
}

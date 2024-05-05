import puppeteer, { Browser, Page } from "puppeteer";

export async function startBrowser(url: string, headless: boolean) {
    const browser = await puppeteer.launch({ headless });
    const page = await browser.newPage();

    await page.goto(url, { timeout: 60_000 });
    await page.waitForNetworkIdle();

    // always use light mode. Otherwise the tests might depend on the OS setting
    // of each developer and thus leads to inconsistent test results.
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

    return { browser, page };
}

export async function stopBrowser(browser: Browser, page: Page) {
    await page.close();
    await browser.close();
}

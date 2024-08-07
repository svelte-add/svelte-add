import { chromium, type Browser } from 'playwright';

let browser: Browser;

export async function startBrowser(headless: boolean) {
	browser = await chromium.launch({ headless });
}

export async function openPage(url: string) {
	const page = await browser.newPage();

	await page.goto(url, { timeout: 60_000 });
	await page.waitForLoadState('networkidle');

	// always use light mode. Otherwise the tests might depend on the OS setting
	// of each developer and thus leads to inconsistent test results.
	await page.emulateMedia({ colorScheme: 'light' });

	return page;
}

export async function stopBrowser() {
	await browser.close();
}

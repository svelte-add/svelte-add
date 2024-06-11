import type { AdderWithoutExplicitArgs, Tests } from "@svelte-add/core/adder/config";
import type { OptionValues, Question } from "@svelte-add/core/adder/options";
import type { Page } from "playwright";

export async function runTests(page: Page, adder: AdderWithoutExplicitArgs, options: OptionValues<Record<string, Question>>) {
    const tests: Tests = {
        expectProperty: async (selector, property, expectedValue) => {
            await expectProperty(page, selector, property, expectedValue);
        },
        elementExists: async (selector) => {
            await elementExists(page, selector);
        },
        click: async (selector, waitForNavigation) => {
            await click(page, selector, waitForNavigation);
        },
        expectUrlPath: async (path) => {
            await expectUrlPath(page, path);
        },
    };

    await executeAdderTests(adder, tests, options);
}

async function executeAdderTests(
    adder: AdderWithoutExplicitArgs,
    testMethods: Tests,
    options: OptionValues<Record<string, Question>>,
) {
    if (!adder.tests || !adder.tests.tests || adder.tests.tests.length == 0) throw new Error(`Cannot test adder without tests!`);

    for (const test of adder.tests.tests) {
        if (test.condition && !test.condition(options)) continue;

        await test.run(testMethods);
    }
}

async function elementExists(page: Page, selector: string) {
    const elementToCheck = await page.$(selector);
    if (!elementToCheck) {
        throw new Error("No element found for selector " + selector);
    }

    return elementToCheck;
}

async function click(page: Page, selector: string, waitForNavigation: boolean) {
    await elementExists(page, selector);

    await page.click(selector, { noWaitAfter: !waitForNavigation });
}

async function expectUrlPath(page: Page, path: string) {
    const url = new URL(page.url());

    if (url.pathname !== path) {
        throw new Error(`Found path ${url.pathname} but expected ${path}!`);
    }
}

async function expectProperty(page: Page, selector: string, property: string, expectedValue: string) {
    const elementToCheck = await elementExists(page, selector);

    const aWindowHandle = await page.evaluateHandle(() => window);
    const computedStyle = await page.evaluate(([element, pV, window]) => window.getComputedStyle(element).getPropertyValue(pV), [
        elementToCheck,
        property,
        aWindowHandle,
    ] as const);
    await aWindowHandle.dispose();

    if (computedStyle !== expectedValue) {
        throw new Error(`Expected '${expectedValue}' but got '${computedStyle}' for selector '${selector}'`);
    }

    return computedStyle;
}

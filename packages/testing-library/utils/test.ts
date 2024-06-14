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
        click: async (selector, path) => {
            await click(page, selector, path);
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        expectUrlPath: async (path) => {
            expectUrlPath(page, path);
        },
    };

    await executeAdderTests(adder, tests, options);
}

async function executeAdderTests(
    adder: AdderWithoutExplicitArgs,
    testMethods: Tests,
    options: OptionValues<Record<string, Question>>,
) {
    if (!adder.tests || adder.tests.tests.length == 0) throw new Error(`Cannot test adder without tests!`);

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

/**
 * @param path If the click action results in a navigation, provide the expected path
 *
 * @example
 * ```js
 * await click(page, "a.some-link", "/some-path");
 * ```
 */
async function click(page: Page, selector: string, path?: string) {
    await elementExists(page, selector);

    await page.click(selector);

    if (path) {
        await page.waitForURL((url) => url.pathname === path);
    }
}

function expectUrlPath(page: Page, path: string) {
    const url = new URL(page.url());

    if (url.pathname !== path) {
        throw new Error(`Found path ${url.pathname} but expected ${path}!`);
    }
}

async function expectProperty(page: Page, selector: string, property: string, expectedValue: string) {
    const elementToCheck = await elementExists(page, selector);

    const computedStyle = await page.evaluate(([element, pV]) => window.getComputedStyle(element).getPropertyValue(pV), [
        elementToCheck,
        property,
    ] as const);

    if (computedStyle !== expectedValue) {
        throw new Error(`Expected '${expectedValue}' but got '${computedStyle}' for selector '${selector}'`);
    }

    return computedStyle;
}

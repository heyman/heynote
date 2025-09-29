import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("test show whitespace", async ({ page }) => {
    heynotePage.setContent(`
∞∞∞text
	   
`)

    await expect(page.locator('.cm-highlightSpace')).toHaveCount(0);
    await expect(page.locator('.cm-highlightTab')).toHaveCount(0);

    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-appearance").click()
    await page.getByText("Show white-space").click()
    await page.locator("body").press("Escape")

    await expect(page.locator('.cm-highlightSpace')).toHaveCount(3);
    await expect(page.locator('.cm-highlightTab')).toHaveCount(1);
})

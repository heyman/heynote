import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("test bracket closing default off", async ({ page }) => {
    await page.locator("body").pressSequentially("{")
    expect(await heynotePage.getBlockContent(0)).toBe("{")
})

test("test bracket closing", async ({ page }) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-editing").click()
    await page.getByLabel("Auto-close brackets and quotation marks").click()
    await page.locator("body").press("Escape")
    await page.locator("body").pressSequentially("{")
    expect(await heynotePage.getBlockContent(0)).toBe("{}")
    await page.locator("body").press("Backspace")
    expect(await heynotePage.getBlockContent(0)).toBe("")
    await page.locator("body").pressSequentially("(hej")
    await page.locator("body").pressSequentially("(hej)")
})

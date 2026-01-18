import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("test default tab size", async ({ page }) => {
    await page.locator("body").press("Tab")
    expect(await heynotePage.getBlockContent(0)).toBe("    ")
})

test("test custom tab size", async ({ page }) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-editing").click()
    await page.locator("css=select.tab-size").selectOption("2")
    await page.locator("body").press("Escape")
    await page.locator("body").press("Tab")
    expect(await heynotePage.getBlockContent(0)).toBe("  ")
})

test("test indent type", async ({ page }) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-editing").click()
    await page.locator("css=select.indent-type").selectOption("tab")
    await page.locator("body").press("Escape")
    await page.locator("body").press("Tab")
    expect(await heynotePage.getBlockContent(0)).toBe("\t")
})

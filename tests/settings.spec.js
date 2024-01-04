import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    console.log("beforeEach")
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});


test("test open settings dialog", async ({ page }) => {
    page.locator("css=.status-block.settings").click()
    await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
})

test("test close settings dialog", async ({ page }) => {
    page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .bottom-bar .close").click()
    await expect(page.locator("css=.overlay .settings .dialog")).not.toBeVisible()
})

test("test close settings dialog with escape", async ({ page }) => {
    page.locator("css=.status-block.settings").click()
    await page.locator("body").press("Escape")
    await expect(page.locator("css=.overlay .settings .dialog")).not.toBeVisible()
})

test("test change line gutter setting", async ({ page }) => {
    await expect(page.locator("css=.cm-lineNumbers")).toBeVisible()
    page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .sidebar li.tab-appearance").click()
    await expect(page.locator("css=.settings .tab-content.tab-appearance")).toBeVisible()
    page.getByLabel("Show line numbers").click()
    await expect(page.locator("css=.cm-lineNumbers")).toBeHidden()
    expect((await heynotePage.getStoredSettings()).showLineNumberGutter).toBe(false)
    page.getByLabel("Show line numbers").click()
    await expect(page.locator("css=.cm-lineNumbers")).toBeVisible()
    expect((await heynotePage.getStoredSettings()).showLineNumberGutter).toBe(true)
})

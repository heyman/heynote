import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

/** @type HeynotePage */
let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});


test("test open settings dialog", async ({ page }) => {
    await page.locator("css=.status-block.settings").click()
    await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
})

test("test close settings dialog", async ({ page }) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .bottom-bar .close").click()
    await expect(page.locator("css=.overlay .settings .dialog")).not.toBeVisible()
})

test("test close settings dialog with escape", async ({ page }) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("body").press("Escape")
    await expect(page.locator("css=.overlay .settings .dialog")).not.toBeVisible()
})

test("test change line gutter setting", async ({ page }) => {
    await expect(page.locator("css=.cm-lineNumbers")).toBeVisible()
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .sidebar li.tab-appearance").click()
    await expect(page.locator("css=.settings .tab-content.tab-appearance")).toBeVisible()
    await page.getByLabel("Show line numbers").click()
    await expect(page.locator("css=.cm-lineNumbers")).toBeHidden()
    expect((await heynotePage.getStoredSettings()).showLineNumberGutter).toBe(false)
    await page.getByLabel("Show line numbers").click()
    await expect(page.locator("css=.cm-lineNumbers")).toBeVisible()
    expect((await heynotePage.getStoredSettings()).showLineNumberGutter).toBe(true)
})

test("test load editor without fold gutter", async({ page }) => {
    expect(await page.locator(".cm-foldGutter")).toHaveCount(1)
    await page.evaluate(() => {
        localStorage.setItem("settings", JSON.stringify({showFoldGutter:false}))
    })
    await heynotePage.goto()
    await page.locator("body").pressSequentially("hejsan")
    await expect.poll(async () => heynotePage.getBlockContent(0)).toBe("hejsan")
    expect(await page.locator(".cm-foldGutter")).toHaveCount(0)
})

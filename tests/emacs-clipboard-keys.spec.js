import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});


test("test emacs copy/pase/cut key bindings", async ({ page, browserName }) => {
    if (browserName !== "chromium") {
        // This test only works in Chromium due to accessing the clipboard
        test.skip()
    }
    await page.locator("css=.status-block.settings").click()
    //await page.locator("css=li.tab-editing").click()
    await page.locator("css=select.keymap").selectOption("emacs")
    if (heynotePage.isMac) {
        await page.locator("css=select.metaKey").selectOption("alt")
    }
    await page.locator("body").press("Escape")

    await page.locator("body").pressSequentially("test")
    await page.locator("body").press("Control+Space")
    await page.locator("body").press("Control+A")
    await page.locator("body").press("Alt+W")
    expect(await heynotePage.getBlockContent(0)).toBe("test")
    await page.locator("body").press("Control+Y")
    expect(await heynotePage.getBlockContent(0)).toBe("testtest")
    
    await page.locator("body").press("Control+E")
    await page.locator("body").press("Control+Space")
    await page.locator("body").press("Control+A")
    await page.locator("body").press("Control+W")
    expect(await heynotePage.getBlockContent(0)).toBe("")
    await page.locator("body").press("Control+Y")
    await page.locator("body").press("Control+Y")
    expect(await heynotePage.getBlockContent(0)).toBe("testtesttesttest")
})

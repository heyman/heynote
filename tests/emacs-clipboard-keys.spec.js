import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage, modifierKey

test.beforeEach(async ({ page, browserName }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
    modifierKey = heynotePage.isMac ? "Meta" : "Control"

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
});

async function clearBuffer() {
    await heynotePage.setContent(`
∞∞∞text
`)
}


test("test emacs copy/pase/cut key bindings", async ({ page }) => {
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


// The following tests doesn't really test anything specific to the Emacs key bindings, but triggering 
// Copy/Paste by keyboard shortcuts is not possible in Playwright, so we test this functionality using 
// the Emacs key bindings

test("copy current line", async ({ page }) => {
    await page.locator("body").pressSequentially("test line! ")
    await page.keyboard.press("Alt+W")
    await page.keyboard.press("Alt+W")
    await clearBuffer()
    expect(await heynotePage.getBlockContent(0)).toBe("")
    await page.locator("body").press("Control+Y")
    await page.locator("body").press("Control+Y")
    expect(await heynotePage.getBlockContent(0)).toBe("test line! test line! ")
})

test("copy current multiple cursors", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
line 1
line 2`)
    await page.keyboard.press("Control+A")
    await page.keyboard.press(`${modifierKey}+Alt+ArrowUp`)
    await page.locator("body").pressSequentially("test")
    await page.keyboard.press("Alt+W")
    await clearBuffer()
    expect(await heynotePage.getBlockContent(0)).toBe("")
    await page.keyboard.press("Control+Y")
    //await page.waitForTimeout(100);
    expect(await heynotePage.getBlockContent(0)).toBe(`testline 1\ntestline 2`)
})

test("copy current multiple cursors on same line", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
test`)
    await page.keyboard.press("Control+A")
    await page.keyboard.press(`${modifierKey}+Alt+ArrowDown`)
    await page.locator("body").pressSequentially("1")
    expect(await heynotePage.getBlockContent(0)).toBe("1test1")
    await page.keyboard.press("Alt+W")

    await clearBuffer()
    expect(await heynotePage.getBlockContent(0)).toBe("")

    await page.keyboard.press("Control+Y")
    expect(await heynotePage.getBlockContent(0)).toBe("1test1")
})

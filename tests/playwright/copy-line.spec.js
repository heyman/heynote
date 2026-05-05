import { expect, test } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
    await heynotePage.setContent(`
∞∞∞text
one
two
three`)
});

test("copyLineDown copies the current line below and keeps the cursor on the copy", async ({ page }) => {
    const content = await heynotePage.getContent()
    await heynotePage.setCursorPosition(content.indexOf("two") + 2)
    await page.locator("body").press("Alt+Shift+ArrowDown")
    await page.locator("body").pressSequentially("X")

    expect(await heynotePage.getBlockContent(0)).toBe("one\ntwo\ntwXo\nthree")
});

test("copyLineUp copies the current line above and keeps the cursor on the copy", async ({ page }) => {
    const content = await heynotePage.getContent()
    await heynotePage.setCursorPosition(content.indexOf("two") + 2)
    await page.locator("body").press("Alt+Shift+ArrowUp")
    await page.locator("body").pressSequentially("X")

    expect(await heynotePage.getBlockContent(0)).toBe("one\ntwXo\ntwo\nthree")
});

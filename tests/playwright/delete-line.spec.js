import { expect, test } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    expect((await heynotePage.getBlocks()).length).toBe(1)
    await heynotePage.setContent(`
∞∞∞text
Block A
text content 1
text content 2
text content 3
text content 4
∞∞∞text
Block B
∞∞∞text
Block C`)

    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(3)

    // check that visual block layers are created
    await expect(page.locator("css=.heynote-blocks-layer > div")).toHaveCount(3)
});

test("delete line on single line in Block A", async ({ page }) => {
    for (let i = 0; i < 7; i++) {
        await page.locator("body").press("ArrowUp")
    }
    for (let i = 0; i < 4; i++) {
        await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+k`)
    }
    expect(await heynotePage.getBlockContent(0)).toBe("\ntext content 4");
});

test("delete line on selection in Block B", async ({ page }) => {
    for (let i = 0; i < 1; i++) {
        await page.locator("body").press("ArrowUp")
    }
    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+A`)
    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+k`)
    expect(await heynotePage.getBlockContent(1)).toBe('');
});




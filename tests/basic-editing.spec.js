import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("enter text and create new block", async ({ page }) => {
    expect((await heynotePage.getBlocks()).length).toBe(1)
    await page.locator("body").pressSequentially("Hello World!")
    await page.locator("body").press("Enter")
    await page.locator("body").press(heynotePage.isMac ? "Meta+Enter" : "Control+Enter")
    await page.waitForTimeout(100);
    expect((await heynotePage.getBlocks()).length).toBe(2)
    expect(await heynotePage.getBlockContent(0)).toBe("Hello World!\n")
    expect(await heynotePage.getBlockContent(1)).toBe("")

    // check that visual block layers are created
    expect(await page.locator("css=.heynote-blocks-layer > div").count()).toBe(2)
})

test("backspace", async ({ page }) => {

    await page.locator("body").pressSequentially("Hello World!")
    for (let i=0; i<5; i++) {
        await page.locator("body").press("Backspace")
    }
    expect(await heynotePage.getBlockContent(0)).toBe("Hello W")
})

test("first block is protected", async ({ page }) => {
    const initialContent = await heynotePage.getContent()
    await page.locator("body").press("Backspace")
    expect(await heynotePage.getBlockContent(0)).toBe("")
    expect(await heynotePage.getContent()).toBe(initialContent)
})

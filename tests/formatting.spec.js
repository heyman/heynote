import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
})


test("JSON formatting", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞json
    {"test": 1, "key2": "hey!"}
`)
    expect(await page.locator("css=.status .status-block.lang")).toHaveText("JSON")
    await page.locator("css=.status-block.format").click()
    await page.waitForTimeout(100)
    expect(await heynotePage.getBlockContent(0)).toBe(`{
    "test": 1,
    "key2": "hey!"
}
`)
})

test("JSON formatting (cursor at start)", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞json
    {"test": 1, "key2": "hey!"}
`)
    expect(await page.locator("css=.status .status-block.lang")).toHaveText("JSON")
    for (let i=0; i<5; i++) {
        await page.locator("body").press("ArrowUp")
    }
    await page.locator("css=.status-block.format").click()
    await page.waitForTimeout(100)
    expect(await heynotePage.getBlockContent(0)).toBe(`{
    "test": 1,
    "key2": "hey!"
}
`)
    const block = (await heynotePage.getBlocks())[0]
    expect(await page.evaluate(() => window._heynote_editor.view.state.selection.main.from)).toBe(block.content.from)
})
import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    const date = new Date()
    await heynotePage.setContent(`
∞∞∞text;created=${date.toISOString()}
# Markdown Header
This is some markdown content
- List item 1
- List item 2

Another paragraph here`)

    // for some reason issuing setContent() sometimes ends up in a state where we're scrolled down
    await page.evaluate(() => {
        document.querySelector(".cm-scroller").scrollTop = 0 
    })
});

test("add new block at the end and scroll down", async ({ page }) => {
    const getScrollTop = async () => (await page.evaluate(() => {
        return document.querySelector(".cm-scroller").scrollTop;
    }))
    expect(await getScrollTop()).toBe(0)

    //console.log("scrollTop:", await getScrollTop())
    await page.locator("body").press(heynotePage.isMac ? "Meta+Shift+Enter" : "Control+Shift+Enter")
    expect((await heynotePage.getBlocks()).length).toBe(2)
    //console.log("scrollTop:", await getScrollTop())
    const scrollTop = await getScrollTop()
    expect(scrollTop).toBeGreaterThan(100)
    
    // go up one row, and make sure the scroll margin gets reset
    await (page.locator("body")).press("ArrowUp")
    await expect.poll(async () => scrollTop - await getScrollTop(), {timeout:3000}).toBeGreaterThan(40)
})

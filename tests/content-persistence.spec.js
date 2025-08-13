import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

async function createBuffer(page, name) {
    await page.locator('.add-tab').click()
    await page.waitForSelector('.note-selector')
    await page.locator('.note-selector .new-note').click()
    await page.waitForSelector('.new-buffer')
    await page.locator('.new-buffer input[placeholder="Name"]').fill(name)
    await page.locator('.new-buffer button[type="submit"]').click()
    await page.waitForTimeout(200)
}

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    await page.locator("body").pressSequentially("Content in scratch")
    
    // Set up the exact same conditions as the failing tab reordering test
    await createBuffer(page, 'Buffer 1')
    await createBuffer(page, 'Buffer 2')
    
    // Should now have 3 tabs: scratch, Buffer 1, Buffer 2 (Buffer 2 is active)
    expect(await page.locator('.tab-item').count()).toBe(3)
});

test("content is preserved after page reload", async ({ page }) => {
    // Replicate the exact failing scenario from tab reordering test
    // Add content to Buffer 2 (currently active)
    await page.locator("body").pressSequentially("Content in Buffer 2")
    
    let buffer1Tab = await page.locator('.tab-item').nth(1)
    await buffer1Tab.click()
    await page.locator("body").pressSequentially("Content in Buffer 1")
    
    const scratchTab = await page.locator('.tab-item').first()
    await scratchTab.click()
    
    // Perform the same drag operation that triggered the Firefox issue
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    await buffer2Tab.dragTo(scratchTab)
    await page.waitForTimeout(500)
    
    // Switch to the reordered Buffer 2 (now first tab)
    const reorderedBuffer2Tab = await page.locator('.tab-item').first()
    await reorderedBuffer2Tab.click()
    
    // Wait for content to be saved
    await page.waitForTimeout(300)

    await page.evaluate(() => {
        ['beforeunload', 'unload', 'pagehide'].forEach(eventType => {
          window.addEventListener(eventType, (e) => {
            console.log(`${eventType} event fired`);
          });
        });
      });
    
    // Reload the page - this should trigger the Firefox content loss
    page.evaluate(() => window.location.reload())
    await page.waitForTimeout(1000)
    
    // Should be on Buffer 2 (first tab) after reload, verify content is preserved
    expect(await heynotePage.getBlockContent(0)).toBe("Content in Buffer 2")

    buffer1Tab = await page.locator('.tab-item').nth(1)
    await buffer1Tab.click()
    await page.waitForTimeout(300)
    expect(await heynotePage.getBlockContent(0)).toBe("Content in scratch")
})

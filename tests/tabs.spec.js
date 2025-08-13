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
    
    // Set up two additional buffers for testing
    await createBuffer(page, 'Buffer 1')
    await createBuffer(page, 'Buffer 2')
    
    // Should now have 3 tabs: scratch, Buffer 1, Buffer 2 (Buffer 2 is active)
    expect(await page.locator('.tab-item').count()).toBe(3)
});

test("tabs are visible with pre-created buffers", async ({ page }) => {
    expect(await page.locator('.tab-bar').isVisible()).toBe(true)
    expect(await page.locator('.tab-item').count()).toBe(3)
})

test("switch between tabs by clicking", async ({ page }) => {
    // Add content to current tab (Buffer 2)
    await page.locator("body").pressSequentially("Content in Buffer 2")
    
    // Click on scratch tab (first tab)
    const scratchTab = await page.locator('.tab-item').first()
    await scratchTab.click()
    await page.locator("body").pressSequentially("Content in scratch")
    
    // Click on Buffer 1 tab (second tab)
    const buffer1Tab = await page.locator('.tab-item').nth(1)
    await buffer1Tab.click()
    await page.locator("body").pressSequentially("Content in Buffer 1")
    
    // Click back to Buffer 2 and verify content
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    await buffer2Tab.click()
    
    expect(await heynotePage.getBlockContent(0)).toBe("Content in Buffer 2")
})

test("tab content is preserved when switching", async ({ page }) => {
    // Add content to Buffer 2 (current)
    await page.locator("body").pressSequentially("Buffer 2 content")
    
    // Switch to scratch tab and add content
    const scratchTab = await page.locator('.tab-item').first()
    await scratchTab.click()
    await page.locator("body").pressSequentially("Scratch content")
    
    // Switch back to Buffer 2 and verify content is preserved
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    await buffer2Tab.click()
    expect(await heynotePage.getBlockContent(0)).toBe("Buffer 2 content")
    
    // Switch back to scratch and verify its content is preserved
    await scratchTab.click()
    expect(await heynotePage.getBlockContent(0)).toBe("Scratch content")
})

test("close tab via close button", async ({ page }) => {
    // Add content to Buffer 2 before closing
    await page.locator("body").pressSequentially("Buffer 2 content")
    
    // Add content to Buffer 1 
    const buffer1Tab = await page.locator('.tab-item').nth(1)
    await buffer1Tab.click()
    await page.locator("body").pressSequentially("Buffer 1 content")
    
    // Switch back to Buffer 2
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    await buffer2Tab.click()
    
    // Close Buffer 2 (current active tab)
    await buffer2Tab.hover()
    await buffer2Tab.locator('.close').click()
    
    await page.waitForTimeout(300)
    expect(await page.locator('.tab-item').count()).toBe(2)
    
    // Should switch to Buffer 1 and content should be preserved
    expect(await heynotePage.getBlockContent(0)).toBe("Buffer 1 content")
})

test("cannot close scratch buffer when it's the only tab", async ({ page }) => {
    // Close all non-scratch tabs first
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    await buffer2Tab.hover()
    await buffer2Tab.locator('.close').click()
    
    const buffer1Tab = await page.locator('.tab-item').nth(1)
    await buffer1Tab.hover()
    await buffer1Tab.locator('.close').click()
    
    await page.waitForTimeout(300)
    expect(await page.locator('.tab-item').count()).toBe(1)
    
    // Try to close scratch buffer - should not work
    const scratchTab = await page.locator('.tab-item').first()
    await scratchTab.hover()
    await scratchTab.locator('.close').click()
    
    expect(await page.locator('.tab-item').count()).toBe(1)
})

test("closing last non-scratch tab opens scratch buffer", async ({ page }) => {
    // Close Buffer 1 first
    const buffer1Tab = await page.locator('.tab-item').nth(1)
    await buffer1Tab.hover()
    await buffer1Tab.locator('.close').click()
    
    await page.waitForTimeout(300)
    expect(await page.locator('.tab-item').count()).toBe(2)
    
    // Close Buffer 2 (last non-scratch tab)
    const buffer2Tab = await page.locator('.tab-item.active')
    await buffer2Tab.hover()
    await buffer2Tab.locator('.close').click()
    
    await page.waitForTimeout(300)
    expect(await page.locator('.tab-item').count()).toBe(1)
    expect(await page.locator('.tab-item .title').textContent()).toContain("Scratch")
})

test("open new tab via keyboard shortcut", async ({ page }) => {
    await page.locator("body").press(heynotePage.isMac ? "Meta+p" : "Control+p")
    await page.waitForSelector('.note-selector')
    await page.locator('.note-selector .new-note').click()
    await page.waitForSelector('.new-buffer')
    await page.locator('.new-buffer input[placeholder="Name"]').fill('Keyboard Tab')
    await page.locator('.new-buffer button[type="submit"]').click()
    
    await page.waitForTimeout(300)
    expect(await page.locator('.tab-item').count()).toBe(4)
})

test("close tab via keyboard shortcut", async ({ page }) => {
    // Add content to Buffer 2 before closing
    await page.locator("body").pressSequentially("Buffer 2 keyboard content")
    
    // Add content to scratch tab
    const scratchTab = await page.locator('.tab-item').first()
    await scratchTab.click()
    await page.locator("body").pressSequentially("Scratch keyboard content")
    
    // Switch back to Buffer 2
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    await buffer2Tab.click()
    
    // Close current tab (Buffer 2) with keyboard shortcut
    await page.locator("body").press(heynotePage.isMac ? "Meta+w" : "Control+w")
    
    await page.waitForTimeout(300)
    expect(await page.locator('.tab-item').count()).toBe(2)
    
    // Should switch to scratch tab and content should be preserved
    expect(await heynotePage.getBlockContent(0)).toBe("Scratch keyboard content")
})

test("open new tab via add button", async ({ page }) => {
    await createBuffer(page, 'New Tab')
    expect(await page.locator('.tab-item').count()).toBe(4)
})


test("reorder tabs by dragging and verify order persistence", async ({ page }) => {
    // Wait for buffers to be loaded properly
    await page.waitForTimeout(1000)
    
    // Use hardcoded titles for reliable testing
    const scratchTitle = 'Scratch'
    const buffer1Title = 'Buffer 1' 
    const buffer2Title = 'Buffer 2'
    
    // Drag Buffer 2 (3rd tab) to the first position using dragTo method
    const buffer2Tab = await page.locator('.tab-item').nth(2)
    const scratchTab = await page.locator('.tab-item').first()
    
    // Perform drag and drop operation using Playwright's dragTo method
    await buffer2Tab.dragTo(scratchTab)
    
    // Wait for the reorder to complete
    await page.waitForTimeout(500)
    
    // Verify the new tab order
    const reorderedTabTitles = await page.locator('.tab-item .title').allTextContents()
    expect(reorderedTabTitles).toEqual([buffer2Title, scratchTitle, buffer1Title])
    
    // Reload the page to test order persistence
    await page.reload()
    await page.waitForTimeout(2000)
    
    // Verify the tab order is preserved after reload
    const persistedTabTitles = await page.locator('.tab-item .title').allTextContents()
    expect(persistedTabTitles[0]).toBe(buffer2Title)  // Buffer 2 should be first
    expect(persistedTabTitles[1]).toBe(scratchTitle)  // Scratch should be in middle
    expect(persistedTabTitles[2]).toBe(buffer1Title)  // Buffer 1 should be last
    expect(persistedTabTitles.length).toBe(3)         // Should still have 3 tabs
    
    // Verify tabs are still functional after reload
    await page.locator('.tab-item').first().click()
    await page.locator('.tab-item').nth(1).click() 
    await page.locator('.tab-item').nth(2).click()
})


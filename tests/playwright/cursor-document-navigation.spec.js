import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("cursorDocStart moves to beginning of document", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First block content
∞∞∞javascript
console.log("second block")
∞∞∞markdown
# Third block
Some markdown content
`)
    
    // Move cursor to the end of the document
    await page.locator("body").press("Control+End")
    
    // Move cursor to the beginning of the document
    await page.locator("body").press("Control+Home")
    
    // Verify cursor is at the beginning
    const cursorPosition = await heynotePage.getCursorPosition()
    expect(cursorPosition).toBe(9) // After the first block delimiter "∞∞∞text\n"
})

test("cursorDocEnd moves to end of document", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First block content
∞∞∞javascript
console.log("second block")
∞∞∞markdown
# Third block
Some markdown content
`)
    
    // Move cursor to the beginning of the document
    await page.locator("body").press("Control+Home")
    
    // Move cursor to the end of the document
    await page.locator("body").press("Control+End")
    
    // Verify cursor is at the end
    const content = await heynotePage.getContent()
    const cursorPosition = await heynotePage.getCursorPosition()
    expect(cursorPosition).toBe(content.length)
})

test("selectDocStart selects from cursor to beginning of document", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First block content
∞∞∞javascript
console.log("second block")
∞∞∞markdown
# Third block
Some markdown content
`)
    await page.waitForTimeout(100)

    // Position cursor in the middle of the document (in the second block)
    await heynotePage.setCursorPosition(55)
    await page.waitForTimeout(100)

    // Select from cursor to beginning of document
    await page.locator("body").press("Control+Shift+Home")
    await page.waitForTimeout(100)
    
    // Get selected text
    const selectedText = await page.evaluate(() => {
        const selection = window.getSelection()
        return selection.toString()
    })
    
    // Should select text from cursor position back to beginning
    expect(selectedText.length).toBeGreaterThan(0)
    expect(selectedText).toContain("First block content")
})

test("selectDocEnd selects from cursor to end of document", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First block content
∞∞∞javascript
console.log("second block")
∞∞∞markdown
# Third block
Some markdown content
`)
    
    // Position cursor in the middle of the document (in the first block)
    await page.locator("body").press("Control+Home")
    for (let i = 0; i < 15; i++) {
        await page.locator("body").press("ArrowRight")
    }
    
    // Select from cursor to end of document
    await page.locator("body").press("Control+Shift+End")
    
    // Get selected text
    const selectedText = await page.evaluate(() => {
        const selection = window.getSelection()
        return selection.toString()
    })
    
    // Should select text from cursor position to end
    expect(selectedText.length).toBeGreaterThan(0)
    expect(selectedText).toContain("console.log")
    expect(selectedText).toContain("Some markdown content")
})

test("cursor navigation works with empty blocks", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text

∞∞∞javascript

∞∞∞markdown

`)
    
    // Test moving to beginning
    await page.locator("body").press("Control+End")
    await page.locator("body").press("Control+Home")
    
    const cursorAfterHome = await heynotePage.getCursorPosition()
    expect(cursorAfterHome).toBe(9) // After first block delimiter
    
    // Test moving to end
    await page.locator("body").press("Control+End")
    
    const content = await heynotePage.getContent()
    const cursorAfterEnd = await heynotePage.getCursorPosition()
    expect(cursorAfterEnd).toBe(content.length)
})

test("cursor navigation works in single block", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
Single block with some content
`)
    
    // Move to middle of block
    await page.locator("body").press("Control+Home")
    for (let i = 0; i < 10; i++) {
        await page.locator("body").press("ArrowRight")
    }
    
    // Test Home key
    await page.locator("body").press("Control+Home")
    const cursorAfterHome = await heynotePage.getCursorPosition()
    expect(cursorAfterHome).toBe(9) // After block delimiter
    
    // Test End key
    await page.locator("body").press("Control+End")
    const content = await heynotePage.getContent()
    const cursorAfterEnd = await heynotePage.getCursorPosition()
    expect(cursorAfterEnd).toBe(content.length)
})
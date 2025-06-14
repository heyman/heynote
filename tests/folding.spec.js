import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test.describe("Block Folding", () => {
    test.beforeEach(async ({ page }) => {
        // Set up test content with multiple blocks
        await heynotePage.setContent(`
∞∞∞text
Block A
Line 2 of Block A
Line 3 of Block A
∞∞∞javascript
console.log("Block B")
let x = 42
return x * 2
∞∞∞text
Block C
Single line block
∞∞∞markdown
# Block D
This is a markdown block
- Item 1
- Item 2
`)
        //await page.waitForTimeout(100);
        expect((await heynotePage.getBlocks()).length).toBe(4)
    });

    test("fold gutter doesn't lose editor focus when clicked", async ({ page }) => {
        // Position cursor in first block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        
        // Click on fold gutter to fold the block
        await page.locator(".cm-foldGutter").first().click()
        await page.waitForTimeout(100)
        
        // Type a character - this should work if editor maintained focus
        await page.locator("body").pressSequentially("xyz yay")
        //await page.waitForTimeout(100)
        
        // Verify the character was added to the buffer
        const content = await heynotePage.getContent()
        expect(content).toContain("xyz yay")
    });

    test("line number gutter doesn't lose editor focus when clicked", async ({ page }) => {
        // Position cursor in first block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        
        // Click on line number gutter
        await page.locator(".cm-lineNumbers .cm-gutterElement:visible").first().click()
        await page.waitForTimeout(100)
        
        // Type a character - this should work if editor maintained focus
        await page.locator("body").pressSequentially("abc test")
        
        // Verify the character was added to the buffer
        const content = await heynotePage.getContent()
        expect(content).toContain("abc test")
    });
});
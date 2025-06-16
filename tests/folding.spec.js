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
Block C single line
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
        
        // Type a character - this should work if editor maintained focus
        await page.locator("body").pressSequentially("abc test")
        
        // Verify the character was added to the buffer
        const content = await heynotePage.getContent()
        expect(content).toContain("abc test")
    });

    test("block can be folded", async ({ page }) => {
        // Position cursor in first block (which has multiple lines)
        await heynotePage.setCursorPosition(20) // Middle of Block A
        
        // Verify no fold placeholder exists initially
        await expect(page.locator(".cm-foldPlaceholder")).not.toBeVisible()
        
        // Fold block using keyboard shortcut
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Ctrl+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded by checking for fold placeholder
        await expect(page.locator(".cm-foldPlaceholder")).toBeVisible()
    });

    test("multiple blocks can be folded and unfolded when selection overlaps multiple blocks", async ({ page }) => {
        // Use Ctrl/Cmd+A twice to select all content across all blocks
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // First press selects current block
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Second press selects entire buffer
        
        // Verify no fold placeholders exist initially
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Fold multiple blocks using keyboard shortcut
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Ctrl+["
        await page.locator("body").press(foldKey)
        
        // Verify multiple blocks are folded (should see multiple fold placeholders)
        const foldPlaceholders = page.locator(".cm-foldPlaceholder")
        await expect(foldPlaceholders).toHaveCount(3) // Block A, B, and D should be folded (C is single line so won't fold)
        
        // Unfold all blocks using keyboard shortcut
        const unfoldKey = heynotePage.isMac ? "Alt+Meta+]" : "Alt+Ctrl+]"
        await page.locator("body").press(unfoldKey)
        
        // Verify all blocks are unfolded (no fold placeholders should remain)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
    });

    test("toggleBlockFold works on single block", async ({ page }) => {
        // Position cursor in first block (which has multiple lines)
        await heynotePage.setCursorPosition(20) // Middle of Block A
        
        // Verify no fold placeholder exists initially
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Toggle fold to fold the block
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Ctrl+."
        await page.locator("body").press(toggleKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toBeVisible()
        
        // Toggle fold again to unfold the block
        await page.locator("body").press(toggleKey)
        
        // Verify block is unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
    });

    test("toggleBlockFold works on multiple blocks", async ({ page }) => {
        // Select all content across all blocks
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // First press selects current block
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Second press selects entire buffer
        
        // Verify no fold placeholders exist initially
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Toggle fold to fold multiple blocks
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Ctrl+."
        await page.locator("body").press(toggleKey)
        
        // Verify multiple blocks are folded
        const foldPlaceholders = page.locator(".cm-foldPlaceholder")
        await expect(foldPlaceholders).toHaveCount(3) // Block A, B, and D should be folded (C is single line)
        
        // Toggle fold again to unfold all blocks
        await page.locator("body").press(toggleKey)
        
        // Verify all blocks are unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
    });

    test("toggleBlockFold with mixed folded/unfolded state", async ({ page }) => {
        // Fold Block A first
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Ctrl+["
        await page.locator("body").press(foldKey)
        
        // Verify Block A is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Now select all blocks (some folded, some unfolded)
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // First press selects current block
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Second press selects entire buffer
        
        // Toggle fold on mixed state - should fold all unfolded blocks (since more are unfolded than folded)
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Ctrl+."
        await page.locator("body").press(toggleKey)
        
        // Verify all foldable blocks are now folded (A was already folded, B and D should now be folded too)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(3) // Block A, B, and D
        
        // Toggle fold again - should unfold all blocks
        await page.locator("body").press(toggleKey)
        
        // Verify all blocks are now unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
    });
});
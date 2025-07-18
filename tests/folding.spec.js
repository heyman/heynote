import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";
import { NoteFormat } from "../src/common/note-format.js";

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
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
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
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify multiple blocks are folded (should see multiple fold placeholders)
        const foldPlaceholders = page.locator(".cm-foldPlaceholder")
        await expect(foldPlaceholders).toHaveCount(3) // Block A, B, and D should be folded (C is single line so won't fold)
        
        // Unfold all blocks using keyboard shortcut
        const unfoldKey = heynotePage.isMac ? "Alt+Meta+]" : "Alt+Control+]"
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
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Control+."
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
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Control+."
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
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify Block A is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Now select all blocks (some folded, some unfolded)
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // First press selects current block
        await page.waitForTimeout(100)
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Second press selects entire buffer
        await page.waitForTimeout(100)
        
        // Toggle fold on mixed state - should fold all unfolded blocks (since more are unfolded than folded)
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Control+."
        await page.locator("body").press(toggleKey)
        await page.waitForTimeout(300)
        
        // Verify all foldable blocks are now folded (A was already folded, B and D should now be folded too)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(3) // Block A, B, and D
        
        // Toggle fold again - should unfold all blocks
        await page.locator("body").press(toggleKey)
        
        // Verify all blocks are now unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
    });

    test("toggleBlockFold with mixed folded/unfolded state with many single line blocks", async ({ page }) => {
        await heynotePage.setContent(`
∞∞∞text
hej
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
∞∞∞text
Block C single line`)
        // Fold Block A first
        await heynotePage.setCursorPosition(20) // Middle of Block A

        // Now select all blocks (some folded, some unfolded)
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // First press selects current block
        await page.waitForTimeout(200)
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Second press selects entire buffer
        await page.waitForTimeout(200)
        
        // Toggle fold on mixed state - should fold all unfolded blocks (since more are unfolded than folded)
        const toggleKey = heynotePage.isMac ? "Alt+Meta+." : "Alt+Control+."
        await page.locator("body").press(toggleKey)
        
        // Verify all foldable blocks are now folded (A was already folded, B and D should now be folded too)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(2) // Block A, B, and D
        
        // Toggle fold again - should unfold all blocks
        await page.locator("body").press(toggleKey)
        
        // Verify all blocks are now unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
    });

    test("folded blocks are stored in buffer metadata", async ({ page }) => {
        // Fold Block A (multi-line block)
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Trigger save to persist folded ranges
        await page.evaluate(() => window._heynote_editor.save())
        
        // Get buffer data and parse metadata
        const bufferData = await page.evaluate(() => window._heynote_editor.getContent())
        const note = NoteFormat.load(bufferData)
        
        // Verify that foldedRanges is present in metadata and has one entry
        expect(note.foldedRanges).toBeDefined()
        expect(note.foldedRanges.length).toBe(1)
        expect(note.foldedRanges[0]).toHaveProperty('from')
        expect(note.foldedRanges[0]).toHaveProperty('to')
        expect(typeof note.foldedRanges[0].from).toBe('number')
        expect(typeof note.foldedRanges[0].to).toBe('number')
        
        // Fold Block B (javascript block) as well
        await heynotePage.setCursorPosition(80) // Middle of Block B
        await page.locator("body").press(foldKey)
        
        // Verify both blocks are folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(2)
        
        // Trigger save again
        await page.evaluate(() => window._heynote_editor.save())
        
        // Get updated buffer data and verify two folded ranges
        const updatedBufferData = await page.evaluate(() => window._heynote_editor.getContent())
        const updatedNote = NoteFormat.load(updatedBufferData)
        
        expect(updatedNote.foldedRanges.length).toBe(2)
        
        // Unfold all blocks
        const unfoldKey = heynotePage.isMac ? "Alt+Meta+]" : "Alt+Control+]"
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Select all
        await page.locator("body").press(heynotePage.agnosticKey("Mod+a")) // Select entire buffer
        await page.locator("body").press(unfoldKey)
        
        // Verify no blocks are folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Trigger save and verify foldedRanges is empty
        await page.evaluate(() => window._heynote_editor.save())
        const finalBufferData = await page.evaluate(() => window._heynote_editor.getContent())
        const finalNote = NoteFormat.load(finalBufferData)
        
        expect(finalNote.foldedRanges.length).toBe(0)
    });

    test("folded blocks persist across page reloads", async ({ page }) => {
        // Fold Block A (multi-line block)
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Explicitly trigger save to ensure folded state is persisted
        await page.evaluate(() => window._heynote_editor.save())
        
        // Reload the page
        await page.reload()
        await expect(page.locator(".cm-editor")).toBeVisible()
        
        // Wait a moment for fold state to be restored
        await page.waitForTimeout(100)
        
        // Check if the metadata still contains the folded range
        const bufferData = await page.evaluate(() => window._heynote_editor.getContent())
        const note = NoteFormat.load(bufferData)
        expect(note.foldedRanges.length).toBe(1)
        
        // Verify the block is still folded after reload (visual state)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Now unfold the block
        const unfoldKey = heynotePage.isMac ? "Alt+Meta+]" : "Alt+Control+]"
        await page.locator("body").press(unfoldKey)
        
        // Verify block is unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Explicitly trigger save to ensure unfolded state is persisted
        await page.evaluate(() => window._heynote_editor.save())
        
        // Reload the page again
        await page.reload()
        await expect(page.locator(".cm-editor")).toBeVisible()
        
        // Wait a moment for editor to fully load
        await page.waitForTimeout(100)
        
        // Verify the block is still unfolded after reload
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Also verify the metadata no longer contains folded ranges
        const updatedBufferData = await page.evaluate(() => window._heynote_editor.getContent())
        const updatedNote = NoteFormat.load(updatedBufferData)
        expect(updatedNote.foldedRanges.length).toBe(0)
    });

    test("folded block does not unfold when new block created after it and backspace pressed immediately", async ({ page }) => {
        // Start with a multi-line block followed by an empty block
        await heynotePage.setContent(`
∞∞∞text
Block A line 1
Block A line 2
Block A line 3
`)
        
        // Fold the first block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Position cursor in the second block and create a new block after it
        const blocks = await heynotePage.getBlocks()
        await heynotePage.setCursorPosition(blocks[0].content.from) // Beginning of block
        
        // Create a new block using Ctrl/Cmd+Enter
        await page.locator("body").press(heynotePage.agnosticKey("Mod+Enter"))
        await expect(await heynotePage.getBlocks()).toHaveLength(2) // Should now have 2 blocks
        
        // Immediately press backspace at the beginning of the new block
        await page.locator("body").press("Backspace")
        
        // The folded block should NOT unfold (should still have 1 fold placeholder)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        await expect(await heynotePage.getBlocks()).toHaveLength(1) // Should now have 1 block
    });

    test("folded block unfolds when new block created after it, content added, then backspace at beginning", async ({ page }) => {
        // Start with a multi-line block followed by an empty block
        await heynotePage.setContent(`
∞∞∞text
Block A line 1
Block A line 2
Block A line 3
`)
        
        // Fold the first block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Position cursor in the second block and create a new block after it
        const blocks = await heynotePage.getBlocks()
        await heynotePage.setCursorPosition(blocks[0].content.from) // Beginning of second block
        
        // Create a new block using Ctrl/Cmd+Enter and add content
        await page.locator("body").press(heynotePage.agnosticKey("Mod+Enter"))
        await expect(await heynotePage.getBlocks()).toHaveLength(2) // Should now have 2 blocks
        await page.locator("body").pressSequentially("new content")
        
        // Move cursor to the beginning of the new block content
        await page.locator("body").press("Home") // Go to beginning of line
        
        // Press backspace - this should unfold the folded block since we have content
        await page.locator("body").press("Backspace")
        
        // The folded block SHOULD unfold (should have 0 fold placeholders)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        await expect(await heynotePage.getBlocks()).toHaveLength(1) // Should now have 1 block
    });

    test("folded block does not unfold when new block created before it and delete pressed immediately", async ({ page }) => {
        // Start with an empty block followed by a multi-line block
        await heynotePage.setContent(`
∞∞∞text
Block B line 1
Block B line 2
Block B line 3
`)
        
        // Fold the second block
        const blocks = await heynotePage.getBlocks()
        await heynotePage.setCursorPosition(blocks[0].content.from + 10) // Middle of Block B
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Position cursor in the first block and create a new block before the folded block
        await heynotePage.setCursorPosition(blocks[0].content.from) // Beginning of first block
        
        // Create a new block using Alt+Enter (creates block before current)
        await page.locator("body").press("Alt+Enter")
        await expect(await heynotePage.getBlocks()).toHaveLength(2) // Should now have 2 blocks
        
        // Immediately press delete at the end of the new empty block
        await page.locator("body").press("Delete")
        
        // The folded block should NOT unfold (should still have 1 fold placeholder)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        await expect(await heynotePage.getBlocks()).toHaveLength(1) // Should now have 1 block
    });

    test("folded block unfolds when new block created before it, content added, then delete at end", async ({ page }) => {
        // Start with an empty block followed by a multi-line block
        await heynotePage.setContent(`
∞∞∞text
Block B line 1
Block B line 2
Block B line 3
`)
        
        // Fold the second block
        const blocks = await heynotePage.getBlocks()
        await heynotePage.setCursorPosition(blocks[0].content.from + 10) // Middle of Block B
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Position cursor in the first block and create a new block before the folded block
        await heynotePage.setCursorPosition(blocks[0].content.from) // Beginning of first block
        
        // Create a new block using Alt+Enter and add content
        await page.locator("body").press("Alt+Enter")
        await page.locator("body").pressSequentially("new content")
        await expect(await heynotePage.getBlocks()).toHaveLength(2) // Should now have 2 blocks
        
        // Move cursor to the end of the new block content
        await page.locator("body").press("End") // Go to end of current line
        
        // Press delete - this should unfold the folded block since we have content
        await page.locator("body").press("Delete")
        
        // The folded block SHOULD unfold (should have 0 fold placeholders)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        await expect(await heynotePage.getBlocks()).toHaveLength(1) // Should now have 1 block
    });

    test("typing at the beginning of a folded block unfolds it", async ({ page }) => {
        // Set up test content with a multi-line block
        await heynotePage.setContent(`
∞∞∞text
Block A line 1
Block A line 2
Block A line 3`)
        
        // Fold the block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Position cursor at the very beginning of the folded block (right after the delimiter)
        const blocks = await heynotePage.getBlocks()
        await heynotePage.setCursorPosition(blocks[0].content.from)
        
        // Type a character - this should unfold the block
        await page.locator("body").pressSequentially("X")
        
        // Verify the block is now unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Verify the character was inserted at the beginning
        const content = await heynotePage.getContent()
        expect(content).toContain("XBlock A line 1")
    });

    test("typing at the end of a folded block unfolds it", async ({ page }) => {
        // Set up test content with a multi-line block
        await heynotePage.setContent(`
∞∞∞text
Block A line 1
Block A line 2
Block A line 3`)
        
        // Fold the block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Position cursor at the very end of the folded block (end of last line, not including newline)
        const blocks = await heynotePage.getBlocks()
        await heynotePage.setCursorPosition(blocks[0].content.to)
        
        // Type a character - this should unfold the block
        await page.locator("body").pressSequentially("Y")
        
        // Verify the block is now unfolded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(0)
        
        // Verify the character was inserted at the end
        const content = await heynotePage.getContent()
        expect(content).toContain("Block A line 3Y")
    });

    test("folded block does not unfold when language changes", async ({ page }) => {
        // Set up test content with a multi-line block
        await heynotePage.setContent(`
∞∞∞text
Block A line 1
Block A line 2
Block A line 3`)
        
        // Fold the block
        await heynotePage.setCursorPosition(20) // Middle of Block A
        const foldKey = heynotePage.isMac ? "Alt+Meta+[" : "Alt+Control+["
        await page.locator("body").press(foldKey)
        
        // Verify block is folded
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Get the initial block to verify language change
        const initialBlocks = await heynotePage.getBlocks()
        expect(initialBlocks[0].language.name).toBe("text")
        
        // Position cursor at the beginning of the folded block and open language selector
        await heynotePage.setCursorPosition(initialBlocks[0].content.from)
        await page.locator("body").press(heynotePage.agnosticKey("Mod+L"))
        
        // Select JavaScript language
        await page.locator("body").pressSequentially("javascript")
        await page.locator("body").press("Enter")
        
        // Wait for language change to apply
        await page.waitForTimeout(100)
        
        // Verify the block is still folded (should not unfold due to language change)
        await expect(page.locator(".cm-foldPlaceholder")).toHaveCount(1)
        
        // Verify the language actually changed
        const updatedBlocks = await heynotePage.getBlocks()
        expect(updatedBlocks[0].language.name).toBe("javascript")
        
        // Verify the content is unchanged
        const content = await heynotePage.getContent()
        expect(content).toContain("Block A line 1")
        expect(content).toContain("Block A line 2")
        expect(content).toContain("Block A line 3")
    });

    test("markdown block with trailing empty lines can be fully folded by clicking fold gutter", async ({ page }) => {
        // Set up test content with a markdown block that has several empty lines at the end
        await heynotePage.setContent(`
∞∞∞markdown
# Markdown Header
This is some markdown content
- List item 1
- List item 2

Another paragraph here



`)
        
        // Verify we have one block
        expect((await heynotePage.getBlocks()).length).toBe(1)
        
        // Count the visible lines before folding
        const linesBeforeFold = await page.locator(".cm-line").count()
        expect(linesBeforeFold).toBeGreaterThan(1) // Should have multiple lines
        
        // Position cursor in the markdown block
        await heynotePage.setCursorPosition(30) // Middle of the markdown content
        
        // Verify no fold placeholder exists initially
        await expect(page.locator(".cm-foldPlaceholder")).not.toBeVisible()
        
        // Click on the fold gutter to fold the block
        await page.locator(".cm-foldGutter span[title='Fold line']").first().click()
        
        // Verify block is folded by checking for fold placeholder
        await expect(page.locator(".cm-foldPlaceholder")).toBeVisible()
        
        // Verify that only a single line is visible after folding (the first line with fold placeholder)
        const linesAfterFold = await page.locator(".cm-line").count()
        expect(linesAfterFold).toBe(1)
        
        
        // The fold should include all content including the trailing empty lines
        // We'll verify this by checking that the fold placeholder is present and the content is not visible
        const visibleText = await page.locator(".cm-content").textContent()
        
        // The visible text should not contain the actual markdown content when folded
        expect(visibleText).not.toContain("This is some markdown content")
        expect(visibleText).not.toContain("List item 1")
        expect(visibleText).not.toContain("Another paragraph here")
        
        // The visible text should contain the first line and fold indicator
        expect(visibleText).toContain("# Markdown Header")
        expect(visibleText).toContain("…") // Fold indicator
        
        // Unfold the block by clicking the fold placeholder
        await page.locator(".cm-foldPlaceholder").click()
        
        // Verify the block is unfolded and all content is visible again
        await expect(page.locator(".cm-foldPlaceholder")).not.toBeVisible()
        
        // Verify all lines are visible again
        const linesAfterUnfold = await page.locator(".cm-line").count()
        expect(linesAfterUnfold).toBe(linesBeforeFold)
        
        const unfoldedVisibleText = await page.locator(".cm-content").textContent()
        expect(unfoldedVisibleText).toContain("# Markdown Header")
        expect(unfoldedVisibleText).toContain("This is some markdown content")
        expect(unfoldedVisibleText).toContain("List item 1")
        expect(unfoldedVisibleText).toContain("Another paragraph here")
    });
});
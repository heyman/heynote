import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("basic selection matching highlights other occurrences", async ({ page }) => {
    // Add test content with repeated words
    await page.locator("body").pressSequentially("hello world hello again hello test")
    
    // Position cursor at the beginning of first "hello"
    await heynotePage.setCursorPosition(0)
    
    // Use Mod-d to select the word and trigger selection matching
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // Should have 2 matches highlighted with cm-selectionMatch (3 total - 1 selected = 2 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(2)
})

test("Mod-d selects next occurrence", async ({ page }) => {
    // Add test content
    await page.locator("body").pressSequentially("test word test again test final")
    
    // Position cursor at the beginning of first "test"
    await heynotePage.setCursorPosition(0)
    
    // Use Mod-d to select the word and trigger selection matching
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // Should have 2 matches highlighted (3 total - 1 selected = 2 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(2)
    
    // Press Mod-d to select next occurrence
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // Should have 1 match highlighted (3 total - 2 selected = 1 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(1)
    
    // Should have 2 cursors/selections now
    const selections = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(selections).toBe(2)
    
    // Press Mod-d again to select third occurrence
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // Should have 3 cursors/selections now
    const finalSelections = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(finalSelections).toBe(3)
})

test("Mod-d expands selection to word when nothing is selected", async ({ page }) => {
    // Add test content
    await page.locator("body").pressSequentially("hello world hello again")
    
    // Position cursor in the middle of first "hello"
    await heynotePage.setCursorPosition(2)
    
    // Press Mod-d to expand selection to word
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // Should have selected the word "hello" and highlighted other occurrences (2 total - 1 selected = 1 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(1)
    
    // Check that "hello" is selected
    const selectedText = await page.evaluate(() => {
        const state = window._heynote_editor.view.state
        const range = state.selection.ranges[0]
        return state.doc.sliceString(range.from, range.to)
    })
    expect(selectedText).toBe("hello")
})

test("selection matching within current block setting", async ({ page }) => {
    // Create multi-block content
    await heynotePage.setContent(`
∞∞∞text
First block with hello
∞∞∞text
Second block with hello
∞∞∞text
Third block with hello`)
    
    // Position cursor in second block and select "hello"
    await heynotePage.setCursorPosition(50)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // By default, "Within Current Block" should be enabled
    // Should only highlight "hello" in the current block (1 total - 1 selected = 0 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(0)
    
    // Open search panel to access settings
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Toggle off "Within Current Block"
    await page.locator(".search-panel .input-toggle.block").click()
    await page.waitForTimeout(100)
    
    // Close search panel (settings update automatically)
    await page.locator("body").press("Escape")
    await page.waitForTimeout(100)
    
    // Should now highlight occurrences across all blocks (3 total - 1 selected = 2 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(2)
})

test("selection matching case sensitivity setting", async ({ page }) => {
    // Add test content with mixed case
    await page.locator("body").pressSequentially("Hello hello HELLO hELLo")
    
    // Position cursor at the beginning of first "Hello"
    await heynotePage.setCursorPosition(0)
    
    // Use Mod-d to select the word and trigger selection matching
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // By default, should be case-insensitive and match all occurrences (4 total - 1 selected = 3 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(3)
    
    // Open search panel to access settings
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Toggle case sensitivity on
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    await page.waitForTimeout(100)
    
    // Close search panel (settings update automatically)
    await page.locator("body").press("Escape")
    await page.waitForTimeout(100)
    
    // Should now only match exact case (1 total - 1 selected = 0 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(0)
})

test("selection matching whole words setting", async ({ page }) => {
    // Add test content with partial and whole word matches
    await page.locator("body").pressSequentially("test testing tested tester")
    
    // Position cursor at the beginning of first "test"
    await heynotePage.setCursorPosition(0)
    
    // Use Mod-d to select the word and trigger selection matching
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // By default, should match partial words (4 total - 1 selected = 3 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(3)
    
    // Open search panel to access settings
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Toggle whole words on
    await page.locator(".search-panel .input-toggle.whole-words").click()
    await page.waitForTimeout(100)
    
    // Close search panel (settings update automatically)
    await page.locator("body").press("Escape")
    await page.waitForTimeout(100)
    
    // Should now only match whole words (1 total - 1 selected = 0 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(0)
})

test("select all selection matches with Mod-Shift-l", async ({ page }) => {
    // Add test content
    await page.locator("body").pressSequentially("word test word again word final")
    
    // Position cursor at the beginning of first "word"
    await heynotePage.setCursorPosition(0)
    
    // Use Mod-d to select the word and trigger selection matching
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // Should have 2 matches highlighted (3 total - 1 selected = 2 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(2)
    
    // Press Mod-Shift-l to select all matches
    await page.locator("body").press(heynotePage.agnosticKey("Mod+Shift+l"))
    await page.waitForTimeout(100)
    
    // Should have 3 cursors/selections now
    const selections = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(selections).toBe(3)
    
    // Type to replace all occurrences
    await page.locator("body").pressSequentially("replaced")
    
    // Check that all occurrences were replaced
    const content = await heynotePage.getContent()
    expect(content).toContain("replaced test replaced again replaced final")
})

test("selection matching with combined settings", async ({ page }) => {
    // Create multi-block content with mixed case and partial matches
    await heynotePage.setContent(`
∞∞∞text
First block with test testing
∞∞∞text
Second block with test and TEST
∞∞∞text
Third block with testing`)
    
    // Position cursor in second block and select "test" (lowercase)
    await heynotePage.setCursorPosition(60)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // By default: case-insensitive, partial matching, within current block
    // Should match in current block (1 total - 1 selected = 0 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(0)
    
    // Open search panel to change settings
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Enable case sensitivity and whole words
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    await page.locator(".search-panel .input-toggle.whole-words").click()
    await page.waitForTimeout(100)
    
    // Close search panel (settings update automatically)
    await page.locator("body").press("Escape")
    await page.waitForTimeout(100)
    
    // Should now only match exact case, whole word, in current block (1 total - 1 selected = 0 highlighted)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(0)
    
    // Open search panel again
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Disable "Within Current Block"
    await page.locator(".search-panel .input-toggle.block").click()
    await page.waitForTimeout(100)
    
    // Close search panel (settings update automatically)
    await page.locator("body").press("Escape")
    await page.waitForTimeout(100)
    
    // Should now match exact case, whole word, across all blocks (3 total - 1 selected = 2 highlighted)  
    // The matches are: "test" in first block, "test" in second block (selected), and partial "test" in "testing"
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(2)
})

test("selection matching with no matches", async ({ page }) => {
    // Add test content
    await page.locator("body").pressSequentially("hello world unique")
    
    // Position cursor at the beginning of "unique"
    await heynotePage.setCursorPosition(12)
    
    // Use Mod-d to select the word
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // Should have 0 matches (1 total - 1 selected = 0 highlighted, no other matches)
    await expect(page.locator(".cm-selectionMatch")).toHaveCount(0)
})

test("Mod-d cycling behavior", async ({ page }) => {
    // Add test content
    await page.locator("body").pressSequentially("test one test two test three")
    
    // Position cursor at the beginning of first "test"
    await heynotePage.setCursorPosition(0)
    
    // Use Mod-d to select the word and trigger selection matching
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(200)
    
    // Use Mod-d to select all three occurrences
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // Should have 3 selections
    let selections = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(selections).toBe(3)
    
    // Press Mod-d again - should cycle back to first occurrence
    await page.locator("body").press(heynotePage.agnosticKey("Mod+d"))
    await page.waitForTimeout(100)
    
    // Should still have 3 selections (cycling behavior)
    selections = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(selections).toBe(3)
})
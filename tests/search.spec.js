import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("search panel opens and closes", async ({ page }) => {
    // Open search panel with Ctrl/Cmd+F
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await expect(page.locator(".search-panel")).toBeVisible()
    
    // Close search panel with Escape
    await page.locator("body").press("Escape")
    await expect(page.locator(".search-panel")).not.toBeVisible()
})

test("basic search functionality", async ({ page }) => {
    // Add some test content
    await page.locator("body").pressSequentially("Hello World\nThis is a test\nHello again")
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Search for "Hello"
    await page.locator(".search-panel input[main-field]").fill("Hello")
    
    // Check that matches are highlighted
    await expect(page.locator(".cm-searchMatch")).toHaveCount(2)
    
    // Navigate to next match
    await page.locator("body").press("F3")
    
    // Navigate to previous match
    await page.locator("body").press("Shift+F3")
})

test("within current block setting", async ({ page }) => {
    // Create multi-block content
    await heynotePage.setContent(`
∞∞∞text
First block with Hello
∞∞∞text
Second block with Hello
∞∞∞text
Third block with Hello`)
    
    // Position cursor in second block
    await heynotePage.setCursorPosition(50) // Position in second block
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Ensure "Within Current Block" is enabled (should be default)
    const blockToggle = page.locator(".search-panel .input-toggle.block")
    await expect(blockToggle).toHaveClass(/active/)
    
    // Search for "Hello"
    await page.locator(".search-panel input[main-field]").fill("Hello")
    
    // Should only find 1 match in current block
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Toggle off "Within Current Block"
    await blockToggle.click()
    await expect(blockToggle).not.toHaveClass(/active/)
    
    // Now should find all 3 matches
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Toggle back on
    await blockToggle.click()
    await expect(blockToggle).toHaveClass(/active/)
    
    // Should be back to 1 match
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
})

test("case sensitivity setting", async ({ page }) => {
    // Add test content with mixed case
    await page.locator("body").pressSequentially("Hello hello HELLO hELLo")
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Search for "hello" (lowercase)
    await page.locator(".search-panel input[main-field]").fill("hello")
    
    // By default, should be case-insensitive and find all 4 matches
    await expect(page.locator(".cm-searchMatch")).toHaveCount(4)
    
    // Toggle case sensitivity on
    const caseToggle = page.locator(".search-panel .input-toggle.case-sensitive")
    await expect(caseToggle).not.toHaveClass(/active/)
    await caseToggle.click()
    await expect(caseToggle).toHaveClass(/active/)
    
    // Should now only find 1 exact match
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Toggle case sensitivity off
    await caseToggle.click()
    await expect(caseToggle).not.toHaveClass(/active/)
    
    // Should find all 4 matches again
    await expect(page.locator(".cm-searchMatch")).toHaveCount(4)
})

test("whole words setting", async ({ page }) => {
    // Add test content with partial and whole word matches
    await page.locator("body").pressSequentially("test testing tested tester")
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Search for "test"
    await page.locator(".search-panel input[main-field]").fill("test")
    
    // By default, should find partial matches (4 matches)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(4)
    
    // Toggle whole words on
    const wholeWordToggle = page.locator(".search-panel .input-toggle.whole-words")
    await expect(wholeWordToggle).not.toHaveClass(/active/)
    await wholeWordToggle.click()
    await expect(wholeWordToggle).toHaveClass(/active/)
    
    // Should now only find 1 whole word match
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Toggle whole words off
    await wholeWordToggle.click()
    await expect(wholeWordToggle).not.toHaveClass(/active/)
    
    // Should find all 4 matches again
    await expect(page.locator(".cm-searchMatch")).toHaveCount(4)
})

test("regular expressions setting", async ({ page }) => {
    // Add test content for regex testing
    await page.locator("body").pressSequentially("hello123 world456 test789")
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Search for a regex pattern (should be treated as literal by default)
    await page.locator(".search-panel input[main-field]").fill("\\d+")
    
    // By default, should find no matches (literal search)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(0)
    
    // Toggle regex on
    const regexToggle = page.locator(".search-panel .input-toggle.regex")
    await expect(regexToggle).not.toHaveClass(/active/)
    await regexToggle.click()
    await expect(regexToggle).toHaveClass(/active/)
    
    // Should now find 3 matches (numbers)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Test another regex pattern
    await page.locator(".search-panel input[main-field]").fill("[a-z]+")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3) // hello, world, test
    
    // Toggle regex off
    await regexToggle.click()
    await expect(regexToggle).not.toHaveClass(/active/)
    
    // Should find no matches (literal search for "[a-z]+")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(0)
})

test("search settings persistence", async ({ page }) => {
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Toggle some settings
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    await page.locator(".search-panel .input-toggle.whole-words").click()
    await page.locator(".search-panel .input-toggle.block").click()
    
    // Close search panel
    await page.locator("body").press("Escape")
    
    // Reload page
    await page.reload()
    await page.goto("/")
    await expect(page).toHaveTitle(/Heynote/)
    await expect(page.locator(".cm-editor")).toBeVisible()
    
    // Open search panel again
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Check that settings are preserved
    await expect(page.locator(".search-panel .input-toggle.case-sensitive")).toHaveClass(/active/)
    await expect(page.locator(".search-panel .input-toggle.whole-words")).toHaveClass(/active/)
    await expect(page.locator(".search-panel .input-toggle.block")).not.toHaveClass(/active/)
})

test("combined search settings", async ({ page }) => {
    // Create multi-block content with mixed case
    await heynotePage.setContent(`
∞∞∞text
First block with TEST
∞∞∞text
Second block with test and testing
∞∞∞text
Third block with Test`)
    
    // Position cursor in second block
    await heynotePage.setCursorPosition(50)
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Enable case sensitivity and whole words, keep within current block
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    await page.locator(".search-panel .input-toggle.whole-words").click()
    
    // Search for "test"
    await page.locator(".search-panel input[main-field]").fill("test")
    
    // Should find only 1 match: "test" in current block (case-sensitive, whole word)
    await page.waitForTimeout(300)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Disable within current block
    await page.locator(".search-panel .input-toggle.block").click()
    
    // Should still find only 1 match: "test" in second block (case-sensitive, whole word)
    await page.waitForTimeout(300)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Disable case sensitivity
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    
    // Should find 3 matches: "TEST", "test", "Test" (case-insensitive, whole word)
    await page.waitForTimeout(300)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Disable whole words
    await page.locator(".search-panel .input-toggle.whole-words").click()
    
    // Should find 4 matches: "TEST", "test", "testing", "Test" (case-insensitive, partial)
    await page.waitForTimeout(300)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(4)
})

test("search navigation commands", async ({ page }) => {
    // Add test content
    await page.locator("body").pressSequentially("first match, second match, third match")
    
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    
    // Search for "match"
    await page.locator(".search-panel input[main-field]").fill("match")
    
    // Should find 3 matches
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Initially, no match is selected until navigation is triggered
    await expect(page.locator(".cm-searchMatch.cm-searchMatch-selected")).toHaveCount(0)
    
    // Navigate to first match to start selection
    await page.locator("body").press("F3")
    await page.waitForTimeout(300)
    
    // Now a match should be selected
    await expect(page.locator(".cm-searchMatch.cm-searchMatch-selected")).toHaveCount(1)
    
    // Get the initial selected match position
    const getSelectedMatchText = async () => {
        const selectedMatch = page.locator(".cm-searchMatch.cm-searchMatch-selected")
        return await selectedMatch.textContent()
    }
    
    // Helper to get the index of the selected match
    const getSelectedMatchIndex = async () => {
        const matches = page.locator(".cm-searchMatch")
        const selectedMatch = page.locator(".cm-searchMatch.cm-searchMatch-selected")
        
        const matchCount = await matches.count()
        for (let i = 0; i < matchCount; i++) {
            const match = matches.nth(i)
            const isSelected = await match.evaluate(el => el.classList.contains('cm-searchMatch-selected'))
            if (isSelected) {
                return i
            }
        }
        return -1
    }
    
    // Test F3 (find next) - should move to next match
    let initialIndex = await getSelectedMatchIndex()
    await page.locator("body").press("F3")
    await page.waitForTimeout(300)
    let newIndex = await getSelectedMatchIndex()
    expect(newIndex).toBe((initialIndex + 1) % 3) // Should cycle through matches
    
    // Test F3 again - should move to next match
    initialIndex = newIndex
    await page.locator("body").press("F3")
    await page.waitForTimeout(300)
    newIndex = await getSelectedMatchIndex()
    expect(newIndex).toBe((initialIndex + 1) % 3)
    
    // Test Shift+F3 (find previous) - should move to previous match
    initialIndex = newIndex
    await page.locator("body").press("Shift+F3")
    await page.waitForTimeout(300)
    newIndex = await getSelectedMatchIndex()
    expect(newIndex).toBe((initialIndex - 1 + 3) % 3) // Should cycle backwards
    
    // Test Ctrl/Cmd+G (find next) - should move to next match
    initialIndex = newIndex
    await page.locator("body").press(heynotePage.agnosticKey("Mod+g"))
    await page.waitForTimeout(300)
    newIndex = await getSelectedMatchIndex()
    expect(newIndex).toBe((initialIndex + 1) % 3)
    
    // Test Shift+Ctrl/Cmd+G (find previous) - should move to previous match
    initialIndex = newIndex
    await page.locator("body").press(heynotePage.agnosticKey("Shift+Mod+g"))
    await page.waitForTimeout(300)
    newIndex = await getSelectedMatchIndex()
    expect(newIndex).toBe((initialIndex - 1 + 3) % 3)
    
    // Should always have exactly one selected match
    await expect(page.locator(".cm-searchMatch.cm-searchMatch-selected")).toHaveCount(1)
    
    // All navigation commands should work without errors
    expect(heynotePage.getErrors()).toStrictEqual([])
})
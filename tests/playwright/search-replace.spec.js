import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("search panel replace mode can be opened and closed", async ({ page }) => {
    // Open search panel
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await expect(page.locator(".search-panel")).toBeVisible()
    
    // Initially, replace row should not be visible
    await expect(page.locator(".search-panel .replace").first()).not.toBeVisible()
    
    // Click expand button to show replace
    await page.locator(".search-panel .expand-button").click()
    await expect(page.locator(".search-panel .replace").first()).toBeVisible()
    await expect(page.locator(".search-panel")).toHaveClass(/expanded/)
    
    // Click expand button again to hide replace
    await page.locator(".search-panel .expand-button").click()
    await expect(page.locator(".search-panel .replace").first()).not.toBeVisible()
    await expect(page.locator(".search-panel")).not.toHaveClass(/expanded/)
})

test("basic replace functionality", async ({ page }) => {
    // Add test content using setContent
    await heynotePage.setContent(`
∞∞∞text-a
hello world hello again`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "hello"
    await page.locator(".search-panel input[main-field]").fill("hello")
    await page.waitForTimeout(100)
    await expect(page.locator(".cm-searchMatch")).toHaveCount(2)
    
    // Navigate to first match to select it
    await page.locator("body").press("F3")
    await page.waitForTimeout(100)
    
    // Enter replacement text
    await page.locator(".search-panel .replace input[type='text']").fill("hi")
    await page.waitForTimeout(100)
    
    // Click replace button to replace current occurrence
    await page.locator(".search-panel .button.replace").click()
    await page.waitForTimeout(100)
    
    // Check that first occurrence was replaced
    const content = await heynotePage.getContent()
    expect(content).toContain("hi world hello again")
    
    // Should now have only 1 match remaining
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
})

test("replace next with Enter key", async ({ page }) => {
    // Add test content
    await heynotePage.setContent(`
∞∞∞text-a
test word test again test final`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "test"
    await page.locator(".search-panel input[main-field]").fill("test")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Navigate to first match
    await page.locator("body").press("F3")
    await page.waitForTimeout(100)
    
    // Enter replacement text
    await page.locator(".search-panel .replace input[type='text']").fill("exam")
    
    // Press Enter to replace next
    await page.locator(".search-panel .replace input[type='text']").press("Enter")
    
    // Check that first occurrence was replaced
    const content = await heynotePage.getContent()
    expect(content).toContain("exam word test again test final")
    
    // Should now have 2 matches remaining
    await expect(page.locator(".cm-searchMatch")).toHaveCount(2)
})

test("replace all functionality", async ({ page }) => {
    // Add test content
    await heynotePage.setContent(`
∞∞∞text-a
foo bar foo baz foo`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "foo"
    await page.locator(".search-panel input[main-field]").fill("foo")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Enter replacement text
    await page.locator(".search-panel .replace input[type='text']").fill("replaced")
    
    // Click replace all button
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that all occurrences were replaced
    const content = await heynotePage.getContent()
    expect(content).toContain("replaced bar replaced baz replaced")
    
    // Should have no matches remaining
    await expect(page.locator(".cm-searchMatch")).toHaveCount(0)
})

test("replace all with Ctrl+Enter key", async ({ page }) => {
    // Add test content
    await heynotePage.setContent(`
∞∞∞text-a
cat dog cat bird cat`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "cat"
    await page.locator(".search-panel input[main-field]").fill("cat")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Enter replacement text
    await page.locator(".search-panel .replace input[type='text']").fill("mouse")
    
    // Press Ctrl+Enter to replace all
    await page.locator(".search-panel .replace input[type='text']").press(heynotePage.agnosticKey("Mod+Enter"))
    
    // Check that all occurrences were replaced
    const content = await heynotePage.getContent()
    expect(content).toContain("mouse dog mouse bird mouse")
    
    // Should have no matches remaining
    await expect(page.locator(".cm-searchMatch")).toHaveCount(0)
})

test("replace with case sensitivity setting", async ({ page }) => {
    // Add test content with mixed case
    await heynotePage.setContent(`
∞∞∞text-a
Apple apple APPLE`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "apple" with case sensitivity off (default)
    await page.locator(".search-panel input[main-field]").fill("apple")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Replace all with case insensitive
    await page.locator(".search-panel .replace input[type='text']").fill("fruit")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that all were replaced
    let content = await heynotePage.getContent()
    expect(content).toContain("fruit fruit fruit")
    
    // Reset content and test with case sensitivity on
    await heynotePage.setContent(`
∞∞∞text-a
Apple apple APPLE`)
    
    // Enable case sensitivity
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    
    // Search for "apple" (lowercase)
    await page.locator(".search-panel input[main-field]").fill("apple")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Replace with case sensitive
    await page.locator(".search-panel .replace input[type='text']").fill("fruit")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that only lowercase "apple" was replaced
    content = await heynotePage.getContent()
    expect(content).toContain("Apple fruit APPLE")
})

test("replace with whole words setting", async ({ page }) => {
    // Add test content with partial and whole word matches
    await heynotePage.setContent(`
∞∞∞text-a
cat cats catlike scattered`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "cat" with whole words off (default)
    await page.locator(".search-panel input[main-field]").fill("cat")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(4)
    
    // Replace all with whole words off
    await page.locator(".search-panel .replace input[type='text']").fill("dog")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that partial matches were replaced
    let content = await heynotePage.getContent()
    expect(content).toContain("dog dogs doglike sdogtered")
    
    // Reset content and test with whole words on
    await heynotePage.setContent(`
∞∞∞text-a
cat cats catlike scattered`)
    
    // Enable whole words
    await page.locator(".search-panel .input-toggle.whole-words").click()
    
    // Search for "cat" (whole words only)
    await page.locator(".search-panel input[main-field]").fill("cat")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Replace with whole words only
    await page.locator(".search-panel .replace input[type='text']").fill("dog")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that only whole word "cat" was replaced
    content = await heynotePage.getContent()
    expect(content).toContain("dog cats catlike scattered")
})

test("replace within current block setting", async ({ page }) => {
    // Create multi-block content
    await heynotePage.setContent(`
∞∞∞text
First block with hello
∞∞∞text
Second block with hello
∞∞∞text
Third block with hello`)
    
    // Position cursor in second block
    await heynotePage.setCursorPosition(50)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "hello" within current block (default)
    await page.locator(".search-panel input[main-field]").fill("hello")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Replace in current block only
    await page.locator(".search-panel .replace input[type='text']").fill("hi")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that only current block was replaced
    let content = await heynotePage.getContent()
    expect(content).toContain("First block with hello")
    expect(content).toContain("Second block with hi")
    expect(content).toContain("Third block with hello")
    
    // Reset and test with within current block disabled
    await heynotePage.setContent(`
∞∞∞text
First block with hello
∞∞∞text
Second block with hello
∞∞∞text
Third block with hello`)
    
    // Position cursor in second block again
    await heynotePage.setCursorPosition(50)
    
    // Disable within current block
    await page.locator(".search-panel .input-toggle.block").click()
    
    // Search for "hello" across all blocks
    await page.locator(".search-panel input[main-field]").fill("hello")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Replace across all blocks
    await page.locator(".search-panel .replace input[type='text']").fill("hi")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that all blocks were replaced
    content = await heynotePage.getContent()
    expect(content).toContain("First block with hi")
    expect(content).toContain("Second block with hi")
    expect(content).toContain("Third block with hi")
})

test("replace with regex setting", async ({ page }) => {
    // Add test content with numbers
    await heynotePage.setContent(`
∞∞∞text-a
item1 item2 item3`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Enable regex
    await page.locator(".search-panel .input-toggle.regex").click()
    
    // Search for pattern with capture group
    await page.locator(".search-panel input[main-field]").fill("item(\\d+)")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Replace with capture group reference
    await page.locator(".search-panel .replace input[type='text']").fill("product$1")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that regex replacement worked
    const content = await heynotePage.getContent()
    expect(content).toContain("product1 product2 product3")
})

test("replace navigation with multiple matches", async ({ page }) => {
    // Add test content
    await heynotePage.setContent(`
∞∞∞text-a
one two one three one four`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "one"
    await page.locator(".search-panel input[main-field]").fill("one")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(3)
    
    // Replace text
    await page.locator(".search-panel .replace input[type='text']").fill("1")
    
    // Navigate to first match and replace
    await page.locator("body").press("F3")
    await page.waitForTimeout(100)
    await page.locator(".search-panel .button.replace").click()
    await expect(page.locator(".cm-searchMatch")).toHaveCount(2)
    
    // Replace second occurrence
    await page.locator(".search-panel .button.replace").click()
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Replace third occurrence
    await page.locator(".search-panel .button.replace").click()
    await expect(page.locator(".cm-searchMatch")).toHaveCount(0)
    
    // Check final content
    const content = await heynotePage.getContent()
    expect(content).toContain("1 two 1 three 1 four")
})

test("replace with empty replacement", async ({ page }) => {
    // Add test content
    await heynotePage.setContent(`
∞∞∞text-a
remove this word from here`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "this "
    await page.locator(".search-panel input[main-field]").fill("this ")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Leave replacement empty (effectively deletion)
    await page.locator(".search-panel .replace input[type='text']").fill("")
    // Navigate to first match and replace
    await page.locator("body").press("F3")
    await page.waitForTimeout(100)
    await page.locator(".search-panel .button.replace").click()
    
    // Check that text was deleted
    const content = await heynotePage.getContent()
    expect(content).toContain("remove word from here")
})

test("replace with special characters", async ({ page }) => {
    // Add test content with special characters
    await heynotePage.setContent(`
∞∞∞text-a
test@example.com and test@domain.org`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for "@example.com"
    await page.locator(".search-panel input[main-field]").fill("@example.com")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Replace with different domain
    await page.locator(".search-panel .replace input[type='text']").fill("@newdomain.net")
    // Navigate to first match and replace
    await page.locator("body").press("F3")
    await page.waitForTimeout(100)
    await page.locator(".search-panel .button.replace").click()
    
    // Check that special characters were handled correctly
    const content = await heynotePage.getContent()
    expect(content).toContain("test@newdomain.net and test@domain.org")
})

test("replace combined settings", async ({ page }) => {
    // Create multi-block content with mixed case
    await heynotePage.setContent(`
∞∞∞text
First block with Test testing
∞∞∞text
Second block with test and TEST
∞∞∞text
Third block with testing`)
    
    // Position cursor in second block
    await heynotePage.setCursorPosition(60)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Enable case sensitivity and whole words, keep within current block
    await page.locator(".search-panel .input-toggle.case-sensitive").click()
    await page.locator(".search-panel .input-toggle.whole-words").click()
    
    // Search for "test" (case sensitive, whole words, current block)
    await page.locator(".search-panel input[main-field]").fill("test")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(1)
    
    // Replace with case sensitive, whole words, current block
    await page.locator(".search-panel .replace input[type='text']").fill("exam")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that only the exact match in current block was replaced
    const content = await heynotePage.getContent()
    expect(content).toContain("First block with Test testing")
    expect(content).toContain("Second block with exam and TEST")
    expect(content).toContain("Third block with testing")
})

test("replace does not affect search when no matches", async ({ page }) => {
    // Add test content
    await heynotePage.setContent(`
∞∞∞text-a
hello world`)
    
    // Open search panel and expand replace
    await page.locator("body").press(heynotePage.agnosticKey("Mod+f"))
    await page.locator(".search-panel .expand-button").click()
    
    // Search for non-existent text
    await page.locator(".search-panel input[main-field]").fill("nonexistent")
    await expect(page.locator(".cm-searchMatch")).toHaveCount(0)
    
    // Try to replace (should have no effect)
    await page.locator(".search-panel .replace input[type='text']").fill("replacement")
    await page.locator(".search-panel .button.replace-all").click()
    
    // Check that content is unchanged
    const content = await heynotePage.getContent()
    expect(content).toContain("hello world")
})
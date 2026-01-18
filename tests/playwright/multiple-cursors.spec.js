import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("Alt+Click creates additional cursor", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First line of content
Second line of content
Third line of content
`)
    
    // Initially should have one cursor
    let cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(1)
    
    // Click on first line to position cursor - use actual text location
    await page.locator(".cm-line").first().click()
    await page.waitForTimeout(100)
    
    // Alt+Click on second line to add cursor  
    await page.locator(".cm-line").nth(1).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should now have two cursors
    cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(2)
    
    // Alt+Click on third line to add another cursor
    await page.locator(".cm-line").nth(2).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should now have three cursors
    cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(3)
})

test("Alt+Click removes existing cursor when clicking on it", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First line of content
Second line of content
Third line of content
Fourth line of content
`)
    
    // Click on first line to position cursor
    await page.locator(".cm-line").first().click()
    await page.waitForTimeout(100)
    
    // Alt+Click to create additional cursors
    await page.locator(".cm-line").nth(1).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    await page.locator(".cm-line").nth(2).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    await page.locator(".cm-line").nth(3).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should now have four cursors
    let cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(4)
    
    // Alt+Click on second line cursor to remove it
    await page.locator(".cm-line").nth(1).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should now have three cursors
    cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(3)
    
    // Alt+Click on first line cursor to remove it
    await page.locator(".cm-line").first().click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should now have two cursors
    cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(2)
})

test("Alt+Click works with text selection", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
hello world test
another line here
final line content
`)
    
    // Double click to select "hello" in first line
    await page.locator(".cm-line").first().dblclick()
    await page.waitForTimeout(100)
    
    // Verify we have a selection
    let selectedText = await page.evaluate(() => {
        const state = window._heynote_editor.view.state
        const range = state.selection.ranges[0]
        return state.doc.sliceString(range.from, range.to)
    })
    expect(selectedText).toBe("test")
    
    // Alt+Click on second line to add cursor
    await page.locator(".cm-line").nth(1).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should now have two cursors/selections
    let cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(2)
    
    // Type to replace selected text and add at new cursor
    await page.locator("body").pressSequentially("replaced")
    
    // Check content was updated at both locations
    const content = await heynotePage.getContent()
    expect(content).toContain("hello world replaced")
    expect(content).toContain("another line herereplaced")
})

test("multiple cursors typing behavior", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
Line 1
Line 2
Line 3
`)
    
    // Create multiple cursors at the beginning of each line
    await page.locator(".cm-line").first().click()
    await page.waitForTimeout(100)
    
    await page.locator(".cm-line").nth(1).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    await page.locator(".cm-line").nth(2).click({ modifiers: ['Alt'] })
    await page.waitForTimeout(100)
    
    // Should have three cursors
    let cursors = await page.evaluate(() => {
        return window._heynote_editor.view.state.selection.ranges.length
    })
    expect(cursors).toBe(3)
    
    // Type some text
    await page.locator("body").pressSequentially(">> ")
    
    // Check that text was added at all cursor positions  
    const content = await heynotePage.getContent()
    expect(content).toContain("Line 1>> ")
    expect(content).toContain("Line 2>> ")
    expect(content).toContain("Line 3>> ")
})
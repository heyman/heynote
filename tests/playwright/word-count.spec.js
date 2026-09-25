import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

async function toggleWordCount(page) {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-appearance").click()
    await page.getByLabel("Show word count").click()
    await page.locator("body").press("Escape")
}

test("word count is hidden by default", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
one two three`)

    await expect(page.locator("css=.status-block.line-number")).not.toContainText("Words")

    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-appearance").click()
    await expect(page.getByLabel("Show word count")).not.toBeChecked()
})

test("word count can be enabled and disabled from settings", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
one two three`)
    const lineNumber = page.locator("css=.status-block.line-number")

    await toggleWordCount(page)
    await expect(lineNumber).toContainText("Words 3")
    expect((await heynotePage.getStoredSettings()).showWordCount).toBe(true)

    await toggleWordCount(page)
    await expect(lineNumber).not.toContainText("Words")
    expect((await heynotePage.getStoredSettings()).showWordCount).toBe(false)
})

test("word count updates when typing", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
one two three`)
    const lineNumber = page.locator("css=.status-block.line-number")

    await toggleWordCount(page)
    await expect(lineNumber).toContainText("Words 3")

    await page.locator("body").pressSequentially(" four five")
    await expect(lineNumber).toContainText("Words 5")

    for (let i = 0; i < 5; i++) {
        await page.locator("body").press("Backspace")
    }
    await expect(lineNumber).toContainText("Words 4")
})

test("word count is for the current block", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
one two
three
∞∞∞markdown
# Heading

Some  words,	separated by whitespace.
∞∞∞text
`)
    const lineNumber = page.locator("css=.status-block.line-number")

    await toggleWordCount(page)
    await expect(lineNumber).toContainText("Words 0")

    await heynotePage.setCursorPosition(10)
    await expect(lineNumber).toContainText("Words 3")

    await heynotePage.setCursorPosition(40)
    await expect(lineNumber).toContainText("Words 7")
})

test("toggling word count keeps the status bar on the current buffer", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
one two three`)
    const bufferName = await page.locator("css=.status-block.note").textContent()

    await page.locator(".add-tab").click()
    await page.waitForSelector(".note-selector")
    await page.locator(".note-selector .new-note").click()
    await page.waitForSelector(".new-buffer")
    await page.locator('.new-buffer input[placeholder="Name"]').fill("Other buffer")
    await page.locator('.new-buffer button[type="submit"]').click()
    await expect(page.locator("css=.status-block.note")).toHaveText("Other buffer")

    await page.locator(".tab-item").first().click()
    await expect(page.locator("css=.status-block.note")).toHaveText(bufferName)

    await toggleWordCount(page)
    await expect(page.locator("css=.status-block.line-number")).toContainText("Words 3")
    await expect(page.locator("css=.status-block.note")).toHaveText(bufferName)
})

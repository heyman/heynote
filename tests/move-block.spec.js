import { expect, test } from "@playwright/test"
import { HeynotePage } from "./test-utils.js"

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    expect((await heynotePage.getBlocks()).length).toBe(1)
    await heynotePage.setContent(`
∞∞∞text
Block A
∞∞∞text
Block B
∞∞∞text
Block C`)

    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(3)

    // check that visual block layers are created
    await expect(page.locator("css=.heynote-blocks-layer > div")).toHaveCount(3)
})

test("move the first block up", async ({ page }) => {
    // select the first block, cursor position: "Block A|"
    await page.locator("body").press("ArrowUp")
    await page.locator("body").press("ArrowUp")

    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+Alt+ArrowUp`)
    const cursorPosition = await heynotePage.getCursorPosition()
    const content = await heynotePage.getContent()

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("Block A")
    expect(await heynotePage.getBlockContent(1)).toBe("Block B")
    expect(await heynotePage.getBlockContent(2)).toBe("Block C")
    expect(content.slice(cursorPosition - 1, cursorPosition)).toBe("A")
})

test("move the middle block up", async ({ page }) => {
    // select the second block, cursor position: "Block B|"
    await page.locator("body").press("ArrowUp")

    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+Alt+ArrowUp`)
    const cursorPosition = await heynotePage.getCursorPosition()
    const content = await heynotePage.getContent()

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("Block B")
    expect(await heynotePage.getBlockContent(1)).toBe("Block A")
    expect(await heynotePage.getBlockContent(2)).toBe("Block C")
    expect(content.slice(cursorPosition - 1, cursorPosition)).toBe("B")
})

test("move the last block up", async ({ page }) => {
    // cursor position: "Block C|"
    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+Alt+ArrowUp`)
    const cursorPosition = await heynotePage.getCursorPosition()
    const content = await heynotePage.getContent()

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("Block A")
    expect(await heynotePage.getBlockContent(1)).toBe("Block C")
    expect(await heynotePage.getBlockContent(2)).toBe("Block B")
    expect(content.slice(cursorPosition - 1, cursorPosition)).toBe("C")
})

test("move the first block down", async ({ page }) => {
    // select the first block, cursor position: "Block A|"
    await page.locator("body").press("ArrowUp")
    await page.locator("body").press("ArrowUp")

    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+Alt+ArrowDown`)
    const cursorPosition = await heynotePage.getCursorPosition()
    const content = await heynotePage.getContent()

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("Block B")
    expect(await heynotePage.getBlockContent(1)).toBe("Block A")
    expect(await heynotePage.getBlockContent(2)).toBe("Block C")
    expect(content.slice(cursorPosition - 1, cursorPosition)).toBe("A")
})

test("move the middle block down", async ({ page }) => {
    // select the second block, cursor position: "Block B|"
    await page.locator("body").press("ArrowUp")

    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+Alt+ArrowDown`)
    const cursorPosition = await heynotePage.getCursorPosition()
    const content = await heynotePage.getContent()

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("Block A")
    expect(await heynotePage.getBlockContent(1)).toBe("Block C")
    expect(await heynotePage.getBlockContent(2)).toBe("Block B")
    expect(content.slice(cursorPosition - 1, cursorPosition)).toBe("B")
})

test("move the last block down", async ({ page }) => {
    // cursor position: "Block C|"
    await page.locator("body").press(`${heynotePage.isMac ? "Meta" : "Control"}+Shift+Alt+ArrowDown`)
    const cursorPosition = await heynotePage.getCursorPosition()
    const content = await heynotePage.getContent()

    expect((await heynotePage.getBlocks()).length).toBe(3)
    expect(await heynotePage.getBlockContent(0)).toBe("Block A")
    expect(await heynotePage.getBlockContent(1)).toBe("Block B")
    expect(await heynotePage.getBlockContent(2)).toBe("Block C")
    expect(content.slice(cursorPosition - 1, cursorPosition)).toBe("C")
})

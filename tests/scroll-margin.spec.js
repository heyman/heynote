import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    const date = new Date()
    await heynotePage.setContent(`
∞∞∞text;created=${date.toISOString()}
# Markdown Header
This is some markdown content
- List item 1
- List item 2

Another paragraph here`)

    // for some reason issuing setContent() sometimes ends up in a state where we're scrolled down
    await page.evaluate(() => {
        document.querySelector(".cm-scroller").scrollTop = 0 
    })
});

test("add new block at the end and scroll down", async ({ page }) => {
    const getScrollTop = async () => (await page.evaluate(() => {
        return document.querySelector(".cm-scroller").scrollTop;
    }))
    expect(await getScrollTop()).toBe(0)

    //console.log("scrollTop:", await getScrollTop())
    await page.locator("body").press(heynotePage.isMac ? "Meta+Shift+Enter" : "Control+Shift+Enter")
    expect((await heynotePage.getBlocks()).length).toBe(2)
    //console.log("scrollTop:", await getScrollTop())
    const scrollTop = await getScrollTop()
    expect(scrollTop).toBeGreaterThan(100)
    
    // go up one row, and make sure the scroll margin gets reset
    await (page.locator("body")).press("ArrowUp")
    await expect.poll(async () => scrollTop - await getScrollTop(), {timeout:3000}).toBeGreaterThan(40)
})

test("scroll margin adjusts based on block and line", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞text
First block line 1
First block line 2
∞∞∞text
Line 1
Line 2
Line 3
Line 4
Line 5
Line 6
Line 7`)

    const lineHeight = await page.evaluate(() => window._heynote_editor.view.defaultLineHeight)
    const fullMargin = lineHeight * 5

    const getTopMargin = async () => {
        return await page.evaluate(() => window._heynote_editor.getScrollMargins().top)
    }

    const setCursorAtBlockLine = async (block, lineNumber) => {
        await page.evaluate(({ block, lineNumber }) => {
            const doc = window._heynote_editor.view.state.doc
            const content = doc.sliceString(block.content.from, block.content.to)
            let offset = 0
            let currentLine = 1
            while (currentLine < lineNumber) {
                const nextNewline = content.indexOf("\n", offset)
                if (nextNewline === -1) {
                    break
                }
                offset = nextNewline + 1
                currentLine += 1
            }
            window._heynote_editor.setCursorPosition(block.content.from + offset)
        }, { block, lineNumber })
    }

    const blocks = await heynotePage.getBlocks()
    const lastBlock = blocks[blocks.length - 1]

    await setCursorAtBlockLine(blocks[0], 1)
    await expect.poll(getTopMargin).toBeCloseTo(fullMargin, 1)

    for (let lineNumber = 1; lineNumber <= 7; lineNumber += 1) {
        const expectedMargin = lineHeight * (lineNumber <= 5 ? lineNumber - 1 : 5)
        await setCursorAtBlockLine(lastBlock, lineNumber)
        await expect.poll(getTopMargin).toBeCloseTo(expectedMargin, 1)
    }
})

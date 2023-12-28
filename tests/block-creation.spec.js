import {expect, test} from "@playwright/test";
import {HeynotePage} from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    console.log("beforeEach")
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    expect((await heynotePage.getBlocks()).length).toBe(1)
    heynotePage.setContent(`
∞∞∞text
Block A
∞∞∞text
Block B
∞∞∞text
Block C`)
    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(3)

    // check that visual block layers are created
    expect(await page.locator("css=.heynote-blocks-layer > div").count()).toBe(3)

    // select the second block
    await page.locator("body").press("ArrowUp")
});

test("create block before current", async ({ page }) => {
    await runTest(page, "Alt+Enter", ['A', 'D', 'B', 'C'])
})

test("create block after current", async ({ page }) => {
    await runTest(page, heynotePage.isMac ? "Meta+Enter" : "Control+Enter",['A', 'B', 'D', 'C'])
})

test("create block before first", async ({ page }) => {
    await runTest(page, "Alt+Shift+Enter",['D', 'A', 'B', 'C'])
})

test("create block after last", async ({ page }) => {
    await runTest(page, heynotePage.isMac ? "Meta+Shift+Enter" : "Control+Shift+Enter",['A', 'B', 'C', 'D'])
})

const runTest = async (page, key, expectedBlocks) => {
    // create a new block
    await page.locator("body").press(key)
    await page.waitForTimeout(100);
    await page.locator("body").pressSequentially("Block D")

    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(4)

    // check that the content of each block is correct
    for (const expectedBlock of expectedBlocks) {
        const index = expectedBlocks.indexOf(expectedBlock);
        expect(await heynotePage.getBlockContent(index)).toBe(`Block ${expectedBlock}`)
    }
}


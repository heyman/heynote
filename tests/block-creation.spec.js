import {expect, test} from "@playwright/test";
import {HeynotePage} from "./test-utils.js";

let heynotePage

test.beforeEach(async ({page}) => {
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
    await page.waitForTimeout(100);
    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(3)

    // check that visual block layers are created
    await expect(page.locator("css=.heynote-blocks-layer > div")).toHaveCount(3)
});

/* from A */
test("create block before current (A)", async ({page}) => {
    // select the first block
    await page.locator("body").press("ArrowUp")
    await page.locator("body").press("ArrowUp")
    await runTest(page, "Alt+Enter", ['D', 'A', 'B', 'C'])
})

test("create block after current (A)", async ({page}) => {
    // select the first block
    await page.locator("body").press("ArrowUp")
    await page.locator("body").press("ArrowUp")
    await runTest(page, "Mod+Enter", ['A', 'D', 'B', 'C'])
})

/* from B */
test("create block before current (B)", async ({page}) => {
    // select the second block
    await page.locator("body").press("ArrowUp")
    await runTest(page, "Alt+Enter", ['A', 'D', 'B', 'C'])
})

test("create block after current (B)", async ({page}) => {
    // select the second block
    await page.locator("body").press("ArrowUp")
    await runTest(page, "Mod+Enter", ['A', 'B', 'D', 'C'])
})

/* from C */
test("create block before current (C)", async ({page}) => {
    await runTest(page, "Alt+Enter", ['A', 'B', 'D', 'C'])
})

test("create block after current (C)", async ({page}) => {
    await runTest(page, "Mod+Enter", ['A', 'B', 'C', 'D'])
})

test("create block before first", async ({page}) => {
    await runTest(page, "Alt+Shift+Enter", ['D', 'A', 'B', 'C'])
})

test("create block after last", async ({page}) => {
    for (let i = 0; i < 3; i++) {
        await page.locator("body").press("ArrowUp")
    }
    await runTest(page, "Mod+Shift+Enter", ['A', 'B', 'C', 'D'])
})

test("create block before Markdown block", async ({page}) => {
    await heynotePage.setContent(`
∞∞∞markdown
# Markdown!
`)
    await page.locator("body").press("Alt+Enter")
    await page.waitForTimeout(100);
    expect(await heynotePage.getCursorPosition()).toBe(11)
})

test("create block before first Markdown block", async ({page}) => {
    await heynotePage.setContent(`
∞∞∞markdown
# Markdown!
∞∞∞text
`)
    for (let i = 0; i < 5; i++) {
        await page.locator("body").press("ArrowDown")
    }
    await page.locator("body").press("Alt+Shift+Enter")
    await page.waitForTimeout(100);
    expect(await heynotePage.getCursorPosition()).toBe(11)
})

const runTest = async (page, key, expectedBlocks) => {
    // create a new block
    await page.locator("body").press(key.replace("Mod", heynotePage.isMac ? "Meta" : "Control"))
    await page.waitForTimeout(100);
    await page.locator("body").pressSequentially("Block D")

    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(4)

    // check that the content of each block is correct
    for (const expectedBlock of expectedBlocks) {
        const index = expectedBlocks.indexOf(expectedBlock);
        expect(await heynotePage.getBlockContent(index)).toBe(`Block ${expectedBlock}`)
    }

    // check that only one block delimiter widget has the class first
    await expect(await page.locator("css=.heynote-block-start.first")).toHaveCount(1)
}


test("test custom default block language", async ({ page, browserName }) => {
    heynotePage.setContent(`
∞∞∞text
Text block`)
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-editing").click()
    await page.locator("css=select.block-language").selectOption("Rust")
    await page.locator("body").press("Escape")
    await page.locator("body").press((heynotePage.isMac ? "Meta" : "Control") + "+Enter")
    expect(await heynotePage.getContent()).toBe(`
∞∞∞text
Text block
∞∞∞rust-a
`)

    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-editing").click()
    await page.locator("css=input.language-auto-detect").click()
    await page.locator("body").press("Escape")
    await page.locator("body").press((heynotePage.isMac ? "Meta" : "Control") + "+Enter")
    expect(await heynotePage.getContent()).toBe(`
∞∞∞text
Text block
∞∞∞rust-a

∞∞∞rust
`)
})

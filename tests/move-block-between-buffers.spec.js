import {expect, test} from "@playwright/test";
import {HeynotePage} from "./test-utils.js";

import { AUTO_SAVE_INTERVAL } from "../src/common/constants.js"
import { NoteFormat } from "../src/common/note-format.js"


let heynotePage

test.beforeEach(async ({page}) => {
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
    await page.waitForTimeout(100);
    // check that blocks are created
    expect((await heynotePage.getBlocks()).length).toBe(3)

    // check that visual block layers are created
    await expect(page.locator("css=.heynote-blocks-layer > div")).toHaveCount(3)

    // create secondary buffer
    await heynotePage.saveBuffer("other.txt", `
∞∞∞text-a
First block
∞∞∞math
Second block`)
});


test("move block to other buffer", async ({page}) => {
    await page.locator("body").press(heynotePage.agnosticKey("Mod+S"))
    await page.waitForTimeout(50)
    await page.locator("body").press("Enter")
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50);

    const buffers = Object.keys(await heynotePage.getStoredBufferList())
    expect(buffers).toContain("other.txt")

    await expect.poll(async () => await heynotePage.getContent()).toBe(`
∞∞∞text
Block A
∞∞∞text
Block B`)

    await expect.poll(async () => {
        const otherBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("other.txt"))
        return otherBuffer.content
    }).toBe(`
∞∞∞text-a
First block
∞∞∞math
Second block
∞∞∞text
Block C`)

})


test("move block to other open/cached buffer", async ({page}) => {
    await page.locator("body").press(heynotePage.agnosticKey("Mod+P"))
    await page.locator("body").press("Enter")
    await page.waitForTimeout(50)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+P"))
    await page.locator("body").press("Enter")
    await page.waitForTimeout(50)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+S"))
    await page.waitForTimeout(50)
    await page.locator("body").press("Enter")
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50);

    const buffers = Object.keys(await heynotePage.getStoredBufferList())
    expect(buffers).toContain("other.txt")

    const otherBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("other.txt"))

    expect(await heynotePage.getContent()).toBe(`
∞∞∞text
Block A
∞∞∞text
Block B`)

    expect(otherBuffer.content).toBe(`
∞∞∞text-a
First block
∞∞∞math
Second block
∞∞∞text
Block C`)

})

test("cursor position after moving first block", async ({page}) => {
    await heynotePage.setCursorPosition(10)
    expect(await heynotePage.getCursorPosition()).toBe(10)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+S"))
    await page.waitForTimeout(50)
    await page.locator("body").press("Enter")
    await page.waitForTimeout(50)
    expect(await heynotePage.getCursorPosition()).toBe(9)
})

test("cursor position after moving middle block", async ({page}) => {
    await heynotePage.setCursorPosition(28)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+S"))
    await page.waitForTimeout(50)
    await page.locator("body").press("Enter")
    await page.waitForTimeout(50)
    expect(await heynotePage.getCursorPosition()).toBe(25)
})

test("cursor position after moving last block", async ({page}) => {
    await heynotePage.setCursorPosition(48)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+S"))
    await page.waitForTimeout(50)
    await page.locator("body").press("Enter")
    await page.waitForTimeout(50)
    expect(await heynotePage.getCursorPosition()).toBe(32)
})

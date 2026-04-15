import {expect, test} from "@playwright/test";
import {HeynotePage} from "./test-utils.js";

import { AUTO_SAVE_INTERVAL } from "@/src/common/constants.js"
import { NoteFormat } from "@/src/common/note-format.js"


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
});


test("default buffer saved", async ({page}) => {
    // make some change and make sure content is auto saved in default scratch buffer
    await page.locator("body").pressSequentially("YAY")
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50);
    const bufferList = await heynotePage.getStoredBufferList()
    expect(Object.keys(bufferList).length).toBe(1)
    expect(bufferList["scratch.txt"]).toBeTruthy()
})

test("create new buffer from block", async ({page}) => {
    await page.locator("body").press(heynotePage.agnosticKey("Mod+S"))
    await page.waitForTimeout(50)
    await page.locator("body").press("ArrowUp")
    await page.locator("body").press("Enter")
    await page.waitForTimeout(50)
    await page.locator("body").pressSequentially("My New Buffer")
    await page.locator("body").press("Enter")
    await page.waitForTimeout(150)
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50);

    const buffers = Object.keys(await heynotePage.getStoredBufferList())
    expect(buffers).toContain("scratch.txt")
    expect(buffers).toContain("my-new-buffer.txt")

    const defaultBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("scratch.txt"))
    const newBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("my-new-buffer.txt"))

    expect(defaultBuffer.content).toBe(`
∞∞∞text
Block A
∞∞∞text
Block B`)

    expect(newBuffer.content).toBe(`
∞∞∞text
Block C`)

})


test("create new empty note", async ({page}) => {
    await page.locator("body").press("Enter")
    await page.locator("body").press("Backspace")
    await page.locator("body").press(heynotePage.agnosticKey("Mod+N"))
    await page.locator("body").pressSequentially("New Empty Buffer")
    await page.locator("body").press("Enter")
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50);

    const buffers = Object.keys(await heynotePage.getStoredBufferList())
    expect(buffers).toContain("scratch.txt")
    expect(buffers).toContain("new-empty-buffer.txt")

    const defaultBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("scratch.txt"))
    const newBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("new-empty-buffer.txt"))

    expect(defaultBuffer.content).toBe(`
∞∞∞text
Block A
∞∞∞text
Block B
∞∞∞text
Block C`)

    expect(newBuffer.content).toMatch(new RegExp(`
∞∞∞text-a;created=[^∞\\n]+
`))
})


test("create new buffer with chinese characters", async ({page}) => {
    await page.locator("body").press("Enter")
    await page.locator("body").press("Backspace")
    await page.locator("body").press(heynotePage.agnosticKey("Mod+N"))
    await page.locator("body").pressSequentially("我very喜欢你")
    await page.locator("body").press("Enter")
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50);

    const buffers = Object.keys(await heynotePage.getStoredBufferList())
    expect(buffers).toContain("scratch.txt")
    expect(buffers).toContain("wo-very-xi-huan-ni.txt")

    const defaultBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("scratch.txt"))
    const newBuffer = NoteFormat.load(await heynotePage.getStoredBuffer("new-empty-buffer.txt"))

    expect(defaultBuffer.content).toBe(`
∞∞∞text
Block A
∞∞∞text
Block B
∞∞∞text
Block C`)

    expect(newBuffer.content).toMatch(new RegExp(`
∞∞∞text-a;created=[^∞\\n]+
`))
})

test("create scratch buffers via Mod+Shift+N without modal", async ({page}) => {
    for (let i = 0; i < 3; i++) {
        await page.locator("body").press(heynotePage.agnosticKey("Mod+Shift+N"))
        await page.waitForTimeout(100)
        await expect(page.locator(".new-buffer")).toHaveCount(0)
    }
    await page.waitForTimeout(AUTO_SAVE_INTERVAL + 50)

    const buffers = Object.keys(await heynotePage.getStoredBufferList())
    expect(buffers).toContain("scratch-2.txt")
    expect(buffers).toContain("scratch-3.txt")
    expect(buffers).toContain("scratch-4.txt")
})

test("folder selector hides dot-prefixed folders", async ({ page }) => {
    await page.evaluate(async () => {
        await window.heynote.buffer.createDirectory(".secret")
        await window.heynote.buffer.createDirectory("visible")
        await window.heynote.buffer.createDirectory("visible/.nested-hidden")
    })

    await page.locator("body").press(heynotePage.agnosticKey("Mod+N"))
    await expect(page.locator(".new-buffer")).toBeVisible()
    await expect(page.locator(".folder-select-container .folder", { hasText: "visible" })).toBeVisible()
    await expect(page.locator(".folder-select-container .folder", { hasText: ".secret" })).toHaveCount(0)
    await expect(page.locator(".folder-select-container .folder", { hasText: ".nested-hidden" })).toHaveCount(0)
})

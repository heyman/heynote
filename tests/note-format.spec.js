import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";
import { NoteFormat } from "../src/editor/note-format.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});


test("test restore cursor position", async ({ page, browserName }) => {
    heynotePage.setContent(`{"formatVersion":"1.0", "cursors":{"ranges":[{"anchor":13,"head":13}],"main":0}}
∞∞∞text
Textblock`)
    await page.locator("body").press((heynotePage.isMac ? "Meta" : "Control") +  "+Alt+Enter")
    expect(await heynotePage.getContent()).toBe(`
∞∞∞text
Text
∞∞∞text
block`)
})


test("test save cursor positions", async ({ page, browserName }) => {
    heynotePage.setContent(`{"formatVersion":"1.0", "cursors":{"ranges":[{"anchor":9,"head":9}],"main":0}}
∞∞∞text
this
is
a
text
block`)
    await page.locator("body").press((heynotePage.isMac ? "Meta" : "Control") +  "+Alt+ArrowDown")
    await page.locator("body").press((heynotePage.isMac ? "Meta" : "Control") +  "+Alt+ArrowDown")
    await page.locator("body").press("Delete")
    expect(await heynotePage.getContent()).toBe(`
∞∞∞text
his
s

text
block`)

    const bufferData = await heynotePage.getBufferData()
    const note = NoteFormat.load(bufferData)
    expect(note.cursors.ranges.length).toBe(3)
})

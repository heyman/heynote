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
∞∞∞markdown
Block B
∞∞∞text
Block C`)
    await page.waitForTimeout(100)
})

test("delete first block", async ({page}) => {
    await heynotePage.setCursorPosition(10)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+Shift+D"))
    await page.waitForTimeout(50)
    expect(await heynotePage.getCursorPosition()).toBe(13)
})

test("delete middle block", async ({page}) => {
    await heynotePage.setCursorPosition(32)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+Shift+D"))
    await page.waitForTimeout(50)
    expect(await heynotePage.getCursorPosition()).toBe(25)
})

test("delete last block", async ({page}) => {
    await heynotePage.setCursorPosition(52)
    await page.locator("body").press(heynotePage.agnosticKey("Mod+Shift+D"))
    await page.waitForTimeout(50)
    expect(await heynotePage.getCursorPosition()).toBe(36)
})

import {expect, test} from "@playwright/test";
import {HeynotePage} from "./test-utils.js";

/** @type {HeynotePage} */
let heynotePage

test.beforeEach(async ({page}) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});


test("created time updates on first edit in empty block", async ({ page }) => {
    const initialCreated = "2020-01-01T00:00:00.000Z"
    await heynotePage.setContent(`\n∞∞∞text;created=${initialCreated}\n`)
    //await page.waitForTimeout(100)

    await page.locator("body").pressSequentially("X")
    const updatedCreated = await getCreatedTimestamp(heynotePage)
    expect(updatedCreated).not.toBe(initialCreated)
})

test("undo/redo does not update created time", async ({ page }) => {
    const initialCreated = "2020-01-01T00:00:00.000Z"
    await heynotePage.setContent(`\n∞∞∞text;created=${initialCreated}\n`)
    //await page.waitForTimeout(100)

    await page.locator("body").pressSequentially("A")
    const createdAfterInsert = await getCreatedTimestamp(heynotePage)
    expect(createdAfterInsert).not.toBe(initialCreated)

    await page.locator("body").press(heynotePage.isMac ? "Meta+Z" : "Control+Z")
    const createdAfterUndo = await getCreatedTimestamp(heynotePage)
    expect(createdAfterUndo).toBe(initialCreated)

    await page.locator("body").press(heynotePage.isMac ? "Meta+Shift+Z" : "Control+Shift+Z")
    const createdAfterRedo = await getCreatedTimestamp(heynotePage)
    expect(createdAfterRedo).toBe(createdAfterInsert)
})

test("created time does not update if change spans more than one block", async ({ page }) => {
    const initialCreated = "2020-01-01T00:00:00.000Z"
    await heynotePage.setContent(`\n∞∞∞text;created=${initialCreated}\n\n∞∞∞text;created=${initialCreated}\nhej`)
    //await page.waitForTimeout(100)
    await page.locator("body").press("ArrowUp")
    await page.locator("body").press("Shift+ArrowDown")
    await page.locator("body").press("Shift+ArrowDown")
    await page.locator("body").pressSequentially("X")
    const updatedCreated = await getCreatedTimestamp(heynotePage)
    expect(updatedCreated).toBe(initialCreated)
})

test("select multiple blocks including empty block and insert character", async ({ page }) => {
    const initialCreated = "2020-01-01T00:00:00.000Z"
    await heynotePage.setContent(`
∞∞∞text;created=${initialCreated}
a
∞∞∞text;created=${initialCreated}

∞∞∞text;created=${initialCreated}
a`)
    await heynotePage.executeCommand("selectAll")
    await heynotePage.executeCommand("selectAll")
    await page.locator("body").pressSequentially("X")
    expect(await heynotePage.getContent()).toEqual(`\n∞∞∞text;created=${initialCreated}\nX`)
})


const getCreatedTimestamp = async (hPage) => {
    const content = await hPage.getContent()
    const match = content.match(/;created=([^\n;]+)/)
    return match ? match[1] : null
}

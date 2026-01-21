import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
})


test("test language selector search by file ending", async ({ page }) => {
    await page.locator("body").press(heynotePage.agnosticKey("Mod+L"))
    await page.locator("body").pressSequentially("cpp")
    await expect(page.locator("css=.language-selector .items > li.selected")).toHaveText("C++")
})

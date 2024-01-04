import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("test math mode", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞math
42*30+77
`)
    await expect(page.locator("css=.heynote-math-result")).toHaveText("1337")
})

test("test math string result has no quotes", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞math
format(1/3, 3) 
`)
        await expect(page.locator("css=.heynote-math-result")).toHaveText("0.333")
})

test("custom format function", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞math
_format = format
format(x) = _format(x, {notation:"exponential"})
42
`)
    await expect(page.locator("css=.heynote-math-result").last()).toHaveText("4.2e+1")
})

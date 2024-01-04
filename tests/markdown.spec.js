import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("test markdown mode", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞markdown
# Markdown!

- [ ] todo
- [x] done
`)
    await page.waitForTimeout(200)
    //await page.locator("body").pressSequentially("test")
    await expect(page.locator("css=.status .status-block.lang")).toHaveText("Markdown")
})

test("checkbox toggle", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞markdown
- [ ] todo
`)
    const checkbox = await page.locator("css=.cm-content input[type=checkbox]")
    await expect(checkbox).toHaveCount(1)
    await checkbox.click()
    expect(await heynotePage.getBlockContent(0)).toBe("- [x] todo\n")
    await checkbox.click()
    expect(await heynotePage.getBlockContent(0)).toBe("- [ ] todo\n")
})

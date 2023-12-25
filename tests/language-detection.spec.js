import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    console.log("beforeEach")
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
})


test("test valid JSON detection", async ({ page }) => {
    page.locator("body").pressSequentially(`
        {"test": 1, "key2": "hey!"}
    `)
    await page.waitForTimeout(200);
    expect(await page.locator("css=.status .status-block.lang")).toHaveText("JSON (auto)")
    const block = (await heynotePage.getBlocks())[0]
    expect(block.language.name).toBe("json")
    expect(block.language.auto).toBeTruthy()
})


test("python detection", async ({ page }) => {
    page.locator("body").pressSequentially(`
# import complex math module
import cmath

# calculate the discriminant
d = (b**2) - (4*a*c)

# find two solutions
sol1 = (-b-cmath.sqrt(d))/(2*a)
sol2 = (-b+cmath.sqrt(d))/(2*a)

print('The solution are {0} and {1}'.format(sol1,sol2))
    `)
    await page.waitForTimeout(1000);
    expect(await page.locator("css=.status .status-block.lang")).toHaveText("Python (auto)")
})

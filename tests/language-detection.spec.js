import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
})


test("test valid JSON detection", async ({ page }) => {
    await page.locator("body").pressSequentially(`
        {"test": 1, "key2": "hey!"}
    `)
    await expect(page.locator("css=.status .status-block.lang")).toHaveText("JSON (auto)")
    const block = (await heynotePage.getBlocks())[0]
    expect(block.language.name).toBe("json")
    expect(block.language.auto).toBeTruthy()
})


test("python detection", async ({ page }) => {
    await page.locator("body").pressSequentially(`
# import complex math module
import cmath

# calculate the discriminant
d = (b**2) - (4*a*c)

# find two solutions
sol1 = (-b-cmath.sqrt(d))/(2*a)
sol2 = (-b+cmath.sqrt(d))/(2*a)

print('The solution are {0} and {1}'.format(sol1,sol2))
    `)
    await expect(page.locator("css=.status .status-block.lang")).toHaveText("Python (auto)")
})

test("TOML detection", async ({ page }) => {
    await page.locator("body").pressSequentially(`
[build-system]
requires = ["setuptools>=61", "wheel", "setuptools_scm>=6.2"]
build-backend = "setuptools.build_meta"

[project]
name = "locust"
license = { text = "MIT" }
description = "Developer friendly load testing framework"
dynamic = ["version"]
requires-python = ">=3.8"
`)
    await expect(page.locator("css=.status .status-block.lang")).toHaveText("TOML (auto)")
})

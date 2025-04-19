import { expect, test } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";


let heynotePage

test.beforeEach(async ({page}) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
    await heynotePage.setContent(`
∞∞∞text
`)
})

test("add custom key binding", async ({page}) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .sidebar li.tab-keyboard-bindings").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings")).toBeVisible()
    await page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-keybinding").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-key-binding-dialog")).toBeVisible()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-key-binding-dialog input.keys")).toBeFocused()
    await page.locator("body").press("Control+Shift+H")
    await page.locator("body").press("Enter")
    await page.locator("body").pressSequentially("language")
    await page.locator(".p-autocomplete-list li.p-autocomplete-option.p-focus").click()
    await page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-key-binding-dialog .save").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings table tr.keybind-user")).toHaveCount(1)
    await page.locator("css=.overlay .settings .dialog .bottom-bar .close").click()
    await page.locator("body").press("Control+Shift+H")
    await expect(page.locator("css=.language-selector .items > li.selected")).toBeVisible()
})

test("delete custom key binding", async ({page}) => {
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .sidebar li.tab-keyboard-bindings").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings")).toBeVisible()
    await page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-keybinding").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-key-binding-dialog")).toBeVisible()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-key-binding-dialog input.keys")).toBeFocused()
    await page.locator("body").press("Control+Shift+H")
    await page.locator("body").press("Enter")
    await page.locator("body").pressSequentially("language")
    await page.locator(".p-autocomplete-list li.p-autocomplete-option.p-focus").click()
    await page.locator("css=.settings .tab-content.tab-keyboard-bindings .add-key-binding-dialog .save").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings table tr.keybind-user")).toHaveCount(1)
    await page.locator("css=.overlay .settings .dialog .bottom-bar .close").click()
    await page.locator("body").press("Control+Shift+H")
    await expect(page.locator("css=.language-selector .items > li.selected")).toBeVisible()
    
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=.overlay .settings .dialog .sidebar li.tab-keyboard-bindings").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings")).toBeVisible()
    await page.locator("css=.settings .tab-content.tab-keyboard-bindings table tr.keybind-user .delete").click()
    await expect(page.locator("css=.settings .tab-content.tab-keyboard-bindings table tr.keybind-user")).toHaveCount(0)
    await page.locator("css=.overlay .settings .dialog .bottom-bar .close").click()
    await page.locator("body").press("Control+Shift+H")
    await expect(page.locator("css=.language-selector .items > li.selected")).toHaveCount(0)
})

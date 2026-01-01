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
    await expect.poll(async () => await heynotePage.getBlockContent(0)).toBe("- [x] todo\n")
    await checkbox.click()
    await expect.poll(async () => await heynotePage.getBlockContent(0)).toBe("- [ ] todo\n")
})

test("toggle checkbox command", async ({ page }) => {
    const content = `
∞∞∞markdown
- [ ] todo
`
    await heynotePage.setContent(content)
    const cursorPos = content.indexOf("- [ ] todo") + "- [ ] ".length
    await heynotePage.setCursorPosition(cursorPos)
    await heynotePage.executeCommand("toggleCheckbox")
    expect(await heynotePage.getBlockContent(0)).toBe("- [x] todo\n")
    await heynotePage.executeCommand("toggleCheckbox")
    expect(await heynotePage.getBlockContent(0)).toBe("- [ ] todo\n")
})

test("toggle checkbox command with selection", async ({ page }) => {
    const content = `
∞∞∞markdown
- [ ] one
- [x] two
- [x] three
- note
`
    await heynotePage.setContent(content)
    const selectionStart = content.indexOf("- [ ] one")
    const selectionEnd = content.indexOf("- [x] three") + "- [x] three".length
    await page.evaluate(({ selectionStart, selectionEnd }) => {
        window._heynote_editor.view.dispatch({
            selection: { anchor: selectionStart, head: selectionEnd },
            scrollIntoView: true,
        })
    }, { selectionStart, selectionEnd })
    //await heynotePage.executeCommand("toggleCheckbox")
    await page.locator("body").press("ControlOrMeta+Shift+Space")
    expect(await heynotePage.getBlockContent(0)).toBe(
        "- [ ] one\n- [ ] two\n- [ ] three\n- note\n"
    )
})

test("toggle checkbox command across blocks", async ({ page }) => {
    const content = `
∞∞∞markdown
- [x] one
- [x] two
∞∞∞text
- [x] three
- [ ] four
`
    await heynotePage.setContent(content)
    const selectionStart = content.indexOf("- [x] one")
    const selectionEnd = content.indexOf("- [ ] four") + "- [ ] four".length
    await page.evaluate(({ selectionStart, selectionEnd }) => {
        window._heynote_editor.view.dispatch({
            selection: { anchor: selectionStart, head: selectionEnd },
            scrollIntoView: true,
        })
    }, { selectionStart, selectionEnd })
    await heynotePage.executeCommand("toggleCheckbox")
    expect(await heynotePage.getBlockContent(0)).toBe("- [ ] one\n- [ ] two")
    expect(await heynotePage.getBlockContent(1)).toBe("- [x] three\n- [ ] four\n")
})

test("todo list continue on enter", async ({ page }) => {
    const content = `
∞∞∞markdown
- [ ] todo`
    await heynotePage.setContent(content)
    await heynotePage.setCursorPosition(content.length)
    await page.locator("body").press("Enter")
    expect(await heynotePage.getBlockContent(0)).toBe("- [ ] todo\n- [ ] ")
})

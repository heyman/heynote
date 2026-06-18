import { expect, test } from "@playwright/test"
import { HeynotePage } from "./test-utils.js"

function createBufferContent(name, content = "") {
    return JSON.stringify({
        formatVersion: "2.0.0",
        name,
    }) + `\n∞∞∞text-a;created=2026-01-01T00:00:00.000Z\n${content}`
}

function installLibraryState() {
    const settings = {
        showLeftPanel: true,
        leftPanelWidth: 260,
    }
    const notes = {
        "scratch.txt": createBufferContent("Scratch", [
            "first needle match <∞img;id=search-test;file=https://example.com/needle.png;w=10;h=10∞>",
            "second needle match",
            "issue-123 is tracked",
            "Chinese query 中文搜索",
            "short non-match",
        ].join("\n")),
        "folder-a/project.txt": createBufferContent("Project Note", [
            "emoji context 🙂🙂🙂 and a long prefix before the important needle match",
            "issue-456 is done",
            "another non-match",
        ].join("\n")),
        "folder-a/other.txt": createBufferContent("Other Note", "nothing to find here"),
    }
    return { settings, notes }
}

test.describe("library search", () => {
    test.beforeEach(async ({ page }) => {
        const state = installLibraryState()
        await page.addInitScript((seed) => {
            if (!sessionStorage.getItem("__heynoteLibrarySearchSeeded")) {
                localStorage.clear()
                localStorage.setItem("settings", JSON.stringify(seed.settings))
                for (const [path, content] of Object.entries(seed.notes)) {
                    localStorage.setItem(`heynote-library__${path}`, content)
                }
                sessionStorage.setItem("__heynoteLibrarySearchSeeded", "true")
            }
        }, state)

        const heynotePage = new HeynotePage(page)
        await heynotePage.goto()
        await page.getByRole("button", { name: "Search" }).click()
        await expect(page.locator(".search-container")).toBeVisible()
    })

    test("shows grouped results, counts, highlighting, and preview context", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("needle")

        await expect(page.locator(".result-summary")).toContainText("3 results in 2 buffers")
        await expect(page.locator(".result-container")).toHaveCount(2)
        await expect(page.locator(".result-container .buffer", { hasText: "Scratch" })).toBeVisible()
        await expect(page.locator(".result-container .buffer", { hasText: "Project Note" })).toBeVisible()

        await expect(page.locator(".result-container .match")).toHaveCount(3)
        await expect(page.locator(".result-container .match strong", { hasText: "needle" })).toHaveCount(3)
        await expect(page.locator(".result-container .match", { hasText: "needle.png" })).toHaveCount(0)

        const longMatchText = page.locator(".result-container .match", { hasText: "important" })
        await expect(longMatchText).toContainText("...efore the important needle match")
        await expect(longMatchText.locator("strong")).toHaveText("needle")
    })

    test("does not match Heynote syntax", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")

        for (const query of ["Scratch", "created", "text-a", "needle.png"]) {
            await input.fill(query)
            await expect(page.locator(".result-container")).toHaveCount(0)
            await expect(page.locator(".result-summary")).toContainText("0 results in 0 buffers")
        }
    })

    test("supports regular expression searches", async ({ page }) => {
        await page.locator(".search-container .input-toggle.regex").click()
        await page.locator(".search-container input.search-query").fill("issue-\\d+")

        await expect(page.locator(".result-summary")).toContainText("2 results in 2 buffers")
        await expect(page.locator(".result-container .match strong", { hasText: "issue-123" })).toHaveCount(1)
        await expect(page.locator(".result-container .match strong", { hasText: "issue-456" })).toHaveCount(1)
    })

    test("supports CJK queries shorter than three JavaScript characters", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("中")

        await expect(page.locator(".result-summary")).toContainText("1 results in 1 buffers")
        await expect(page.locator(".result-container .match")).toHaveCount(1)
        await expect(page.locator(".result-container .match strong")).toHaveText("中")
    })

    test("persists search setting toggles and defaults them to off", async ({ page }) => {
        const caseSensitiveToggle = page.locator(".search-container .input-toggle.case-sensitive")
        const wholeWordToggle = page.locator(".search-container .input-toggle.whole-words")
        const regexToggle = page.locator(".search-container .input-toggle.regex")

        await expect(caseSensitiveToggle).not.toHaveClass(/active/)
        await expect(wholeWordToggle).not.toHaveClass(/active/)
        await expect(regexToggle).not.toHaveClass(/active/)

        await caseSensitiveToggle.click()
        await wholeWordToggle.click()
        await regexToggle.click()

        await expect.poll(async () => {
            return await page.evaluate(() => JSON.parse(window.localStorage.getItem("settings")).librarySearchSettings)
        }).toEqual({
            caseSensitive: true,
            wholeWord: true,
            regexp: true,
        })

        await page.reload()
        await page.getByRole("button", { name: "Search" }).click()

        await expect(page.locator(".search-container .input-toggle.case-sensitive")).toHaveClass(/active/)
        await expect(page.locator(".search-container .input-toggle.whole-words")).toHaveClass(/active/)
        await expect(page.locator(".search-container .input-toggle.regex")).toHaveClass(/active/)
    })

    test("shows invalid regular expression errors", async ({ page }) => {
        await page.locator(".search-container .input-toggle.regex").click()
        await page.locator(".search-container input.search-query").fill("[invalid")

        await expect(page.locator(".search-error")).toContainText("Invalid regular expression")
        await expect(page.locator(".result-container")).toHaveCount(0)
    })

    test("collapses and expands matches for a buffer", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("needle")
        const scratchResult = page.locator(".result-container", { hasText: "Scratch" })

        await expect(scratchResult.locator(".match")).toHaveCount(2)
        await scratchResult.locator(".buffer").click()
        await expect(scratchResult.locator(".match")).toHaveCount(0)
        await scratchResult.locator(".buffer").click()
        await expect(scratchResult.locator(".match")).toHaveCount(2)
    })

    test("opens a match without focusing the editor and selects the match", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("needle")

        const match = page.locator(".result-container .match", { hasText: "important" })
        await match.click()

        await expect(page.locator(".cm-editor.cm-focused")).toHaveCount(0)
        await expect(page.locator(".results")).toBeFocused()
        await expect(match).toHaveClass(/selected/)
        await expect.poll(async () => {
            return await page.evaluate(() => window._heynote_editor.path)
        }).toBe("folder-a/project.txt")
        await expect.poll(async () => {
            return await page.evaluate(() => {
                const editor = window._heynote_editor
                const selection = editor.view.state.selection.main
                return editor.view.state.doc.sliceString(selection.from, selection.to)
            })
        }).toBe("needle")
    })

    test("does not leak suppressed editor focus after opening a match in the current buffer", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("needle")

        const currentBufferMatch = page.locator(".result-container", { hasText: "Scratch" }).locator(".match", { hasText: "first" })
        await currentBufferMatch.click()
        await expect(page.locator(".results")).toBeFocused()
        await expect(page.locator(".cm-editor.cm-focused")).toHaveCount(0)

        await page.evaluate(() => {
            const store = window._heynote_editor.notesStore
            store.closedTabs = [{ path: "folder-a/project.txt", index: store.openTabs.length }]
            store.reopenLastClosedTab()
        })

        await expect.poll(async () => {
            return await page.evaluate(() => window._heynote_editor.path)
        }).toBe("folder-a/project.txt")
        await expect(page.locator(".cm-editor.cm-focused")).toHaveCount(1)
    })

    test("supports keyboard focus and arrow navigation for result rows", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")
        await expect(page.locator(".result-container .match")).toHaveCount(3)

        const rows = page.locator(".search-result-row")
        const results = page.locator(".results")
        await expect(rows).toHaveCount(5)

        await input.press("ArrowDown")
        await expect(results).toBeFocused()
        await expect(rows.nth(0)).toHaveClass(/selected/)
        await expect(rows.nth(0)).toHaveCSS("outline-style", "solid")

        await results.press("ArrowDown")
        await expect(rows.nth(1)).toHaveClass(/selected/)

        await results.press("ArrowDown")
        await expect(rows.nth(2)).toHaveClass(/selected/)

        await results.press("ArrowDown")
        await expect(rows.nth(3)).toHaveClass(/selected/)

        await results.press("ArrowUp")
        await expect(rows.nth(2)).toHaveClass(/selected/)
    })

    test("does not include result rows in the tab order", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")
        await expect(page.locator(".result-container .match")).toHaveCount(3)

        const rows = page.locator(".search-result-row")
        await input.press("Tab")
        await expect.poll(async () => {
            return await page.evaluate(() => document.activeElement?.classList.contains("search-result-row"))
        }).toBe(false)

        await input.focus()
        await input.press("ArrowDown")
        await expect(page.locator(".results")).toBeFocused()
        await expect(rows.nth(0)).toHaveClass(/selected/)
    })

    test("opens and closes result groups with left and right arrow keys", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")

        const rows = page.locator(".search-result-row")
        const results = page.locator(".results")
        const firstResult = page.locator(".result-container").first()
        await expect(firstResult.locator(".match")).not.toHaveCount(0)

        await input.press("ArrowDown")
        await expect(results).toBeFocused()
        await expect(rows.nth(0)).toHaveClass(/selected/)

        await results.press("ArrowLeft")
        await expect(firstResult.locator(".match")).toHaveCount(0)
        await expect(rows.nth(0)).toHaveClass(/buffer/)
        await expect(rows.nth(1)).toHaveClass(/buffer/)

        await results.press("ArrowRight")
        await expect(firstResult.locator(".match")).not.toHaveCount(0)
        await expect(rows.nth(1)).toHaveClass(/match/)
    })

    test("hides result summary and rows when the query is cleared", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")
        await expect(page.locator(".result-summary")).toBeVisible()

        await input.fill("")
        await expect(page.locator(".result-summary")).toHaveCount(0)
        await expect(page.locator(".result-container")).toHaveCount(0)
    })

    test("focuses the editor and switches to the Buffers tab when Escape is pressed in the search input", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")
        await expect(input).toBeFocused()

        await input.press("Escape")
        await expect(page.locator(".cm-editor")).toHaveClass(/cm-focused/)
        await expect(page.locator(".buffer-tree")).toBeVisible()
        await expect(page.getByRole("button", { name: "Buffers" })).toHaveClass(/selected/)
    })

    test("focuses the editor on Escape after an earlier buffer-tree focus request", async ({ page }) => {
        await page.evaluate(() => {
            window._heynote_editor.notesStore.openBufferExplorer()
        })
        await expect(page.locator(".buffer-tree")).toBeFocused()

        await page.getByRole("button", { name: "Search" }).click()
        const input = page.locator(".search-container input.search-query")
        await expect(input).toBeFocused()

        await input.press("Escape")
        await expect(page.locator(".cm-editor")).toHaveClass(/cm-focused/)
        await expect(page.locator(".buffer-tree")).toBeVisible()
        await expect(page.locator(".buffer-tree")).not.toBeFocused()
    })

    test("focuses the editor and switches to the Buffers tab when Escape is pressed on a focused result", async ({ page }) => {
        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")

        const rows = page.locator(".search-result-row")
        const results = page.locator(".results")
        await input.press("ArrowDown")
        await results.press("ArrowDown")
        await expect(results).toBeFocused()
        await expect(rows.nth(1)).toHaveClass(/selected/)

        await results.press("Escape")
        await expect(page.locator(".cm-editor")).toHaveClass(/cm-focused/)
        await expect(page.locator(".buffer-tree")).toBeVisible()
        await expect(page.getByRole("button", { name: "Buffers" })).toHaveClass(/selected/)
    })

    test("focuses the editor when Escape is pressed after opening a match", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("needle")

        const match = page.locator(".result-container .match", { hasText: "important" })
        await match.click()
        await expect(page.locator(".results")).toBeFocused()

        await page.locator(".results").press("Escape")
        await expect(page.locator(".cm-editor.cm-focused")).toHaveCount(1)
        await expect(page.locator(".buffer-tree")).toBeVisible()
        await expect(page.getByRole("button", { name: "Buffers" })).toHaveClass(/selected/)
    })

    test("opens the search tab and left panel with the default keyboard shortcut", async ({ page }) => {
        await page.locator(".status .status-block.sidebar").click()
        await expect(page.locator(".left-panel")).toHaveCount(0)
        await expect(page.locator(".cm-editor")).toHaveClass(/cm-focused/)

        await page.locator("body").press("ControlOrMeta+Shift+F")

        await expect(page.locator(".left-panel")).toBeVisible()
        await expect(page.locator(".search-container")).toBeVisible()
        await expect(page.getByRole("button", { name: "Search" })).toHaveClass(/selected/)
        await expect(page.locator(".search-container input.search-query")).toBeFocused()
    })

    test("hides the sidebar on Escape when library search was opened from a hidden sidebar", async ({ page }) => {
        await page.locator(".status .status-block.sidebar").click()
        await expect(page.locator(".left-panel")).toHaveCount(0)

        await page.locator("body").press("ControlOrMeta+Shift+F")
        const input = page.locator(".search-container input.search-query")
        await expect(input).toBeFocused()

        await input.press("Escape")
        await expect(page.locator(".left-panel")).toHaveCount(0)
        await expect(page.locator(".cm-editor")).toHaveClass(/cm-focused/)
    })

    test("runs custom global key bindings while the search input is focused", async ({ page }) => {
        await page.evaluate(() => {
            const settings = JSON.parse(window.localStorage.getItem("settings") || "{}")
            settings.keyBindings = [{key: "Ctrl-Shift-h", command: "openCommandPalette"}]
            window.heynote.setSettings(settings)
        })

        const input = page.locator(".search-container input.search-query")
        await input.fill("needle")
        await expect(input).toBeFocused()

        await page.evaluate(() => {
            window.__heynoteTestLastGlobalShortcut = null
            window.addEventListener("keydown", (event) => {
                if (event.key.toLowerCase() === "h" && event.ctrlKey && event.shiftKey) {
                    window.__heynoteTestLastGlobalShortcut = {
                        defaultPrevented: event.defaultPrevented,
                    }
                }
            })
        })

        await input.press("Control+Shift+H")
        await expect.poll(() => page.evaluate(() => window.__heynoteTestLastGlobalShortcut)).toEqual({
            defaultPrevented: true,
        })
        await expect(page.locator(".note-selector .input-container input")).toHaveValue(">")
        await expect(page.locator(".note-selector .items > li.selected")).toBeVisible()
    })

    test("keeps the sidebar visible on Escape after switching away from library search", async ({ page }) => {
        await page.locator(".status .status-block.sidebar").click()
        await expect(page.locator(".left-panel")).toHaveCount(0)

        await page.locator("body").press("ControlOrMeta+Shift+F")
        await expect(page.locator(".search-container input.search-query")).toBeFocused()

        await page.getByRole("button", { name: "Buffers" }).click()
        await expect(page.locator(".buffer-tree")).toBeVisible()

        await page.getByRole("button", { name: "Search" }).click()
        const input = page.locator(".search-container input.search-query")
        await expect(input).toBeFocused()

        await input.press("Escape")
        await expect(page.locator(".left-panel")).toBeVisible()
        await expect(page.locator(".buffer-tree")).toBeVisible()
        await expect(page.getByRole("button", { name: "Buffers" })).toHaveClass(/selected/)
        await expect(page.locator(".cm-editor")).toHaveClass(/cm-focused/)
    })

    test("shows indentation guides when the sidebar is hovered", async ({ page }) => {
        await page.locator(".search-container input.search-query").fill("needle")

        const guide = page.locator(".result-container .match .indent-guide").first()
        await expect(guide).toHaveCount(1)

        await page.mouse.move(500, 200)
        await expect.poll(async () => {
            return await guide.evaluate((element) => window.getComputedStyle(element).opacity)
        }).toBe("0")

        await page.locator(".left-panel").hover()
        await expect.poll(async () => {
            return await guide.evaluate((element) => window.getComputedStyle(element).opacity)
        }).toBe("1")
    })
})

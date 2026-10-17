import { test, expect } from '@playwright/test'
import { HeynotePage } from './test-utils.js'
import { NoteFormat } from '@/src/common/note-format.js'
import { resolveTheme } from '@/src/theme/resolve.js'
import { getColorScheme } from '@/src/theme/schemes/index.js'
import path from 'node:path'

const colors = ['Gray', 'Red', 'Orange', 'Green', 'Blue', 'Purple', 'Pink']

function rgb(hex) {
    return `rgb(${hex.slice(1).match(/../g).map(channel => parseInt(channel, 16)).join(', ')})`
}

async function createBuffer(page, name) {
    await page.locator('.add-tab').click()
    await page.locator('.note-selector .new-note').click()
    await page.locator('.new-buffer input[placeholder="Name"]').fill(name)
    await page.locator('.new-buffer button[type="submit"]').click()
    await expect(page.locator('.tab-item.active .title')).toHaveText(name)
}

async function chooseColor(page, tab, color) {
    await tab.locator('.buffer-color').click()
    const option = page.getByRole('menuitemradio', { name: color, exact: true })
    const swatch = await option.locator('span').evaluate(element => getComputedStyle(element).backgroundColor)
    await option.click()
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.locator('.status')).toHaveCSS('background-color', swatch)
    await expect(tab.locator('.buffer-color span')).toHaveCSS('background-color', swatch)
    const footerText = await page.locator('.status').evaluate(element => getComputedStyle(element).color)
    await expect(page.locator('.status .line-number')).toHaveCSS('color', footerText)
}

async function uiColors(page) {
    return page.evaluate(() => {
        const editor = document.querySelector('.cm-editor:not([style*="display: none"])')
        return {
            status: getComputedStyle(document.querySelector('.status')).backgroundColor,
            block: getComputedStyle(editor.querySelector('.block-odd') || editor.querySelector('.block-even')).backgroundColor,
        }
    })
}

for (const theme of ['light', 'dark']) {
    test(`all seven scratchpad colors update the ${theme} UI and survive reload`, async ({ page }) => {
        const heynote = new HeynotePage(page)
        await heynote.goto()
        await page.evaluate(theme => window.heynote.themeMode.set(theme), theme)
        await expect(page.locator('html')).toHaveAttribute('theme', theme)
        await heynote.setContent('{"formatVersion":"2.0.0","name":"Scratch","custom":[42]}\n∞∞∞text\nFirst\n∞∞∞text\nSecond')
        const tab = page.locator('.tab-item.active')
        const original = await uiColors(page)
        const statuses = new Set()
        const blocks = new Set()

        for (const color of colors) {
            await chooseColor(page, tab, color)
            await expect(page.locator('html')).toHaveAttribute('data-buffer-color', color.toLowerCase())
            const ui = await uiColors(page)
            statuses.add(ui.status)
            blocks.add(ui.block)
            if (color === 'Gray') expect(ui).toEqual(original)
            const note = NoteFormat.load(await heynote.getStoredBuffer('scratch.txt'))
            expect(note.metadata).toMatchObject({ color: color.toLowerCase(), name: 'Scratch', custom: [42] })
            expect(note.content).toBe('\n∞∞∞text\nFirst\n∞∞∞text\nSecond')
        }
        expect(statuses.size).toBe(colors.length)
        expect(blocks.size).toBe(colors.length)

        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'pink')
        await expect(tab.locator('.buffer-color')).toHaveAttribute('aria-label', 'Change color for Scratch (Pink)')
        expect(await heynote.getBlockContent(1)).toBe('Second')
        expect(heynote.getErrors()).toEqual([])
    })
}

test('tab swatches and an open picker follow mode changes for active and inactive notes', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await heynote.goto()
    await page.evaluate(() => window.heynote.themeMode.set('light'))
    const scratch = page.locator('.tab-item').filter({ has: page.locator('.title', { hasText: /^Scratch$/ }) })
    await chooseColor(page, scratch, 'Red')
    await createBuffer(page, 'Work')
    const work = page.locator('.tab-item.active')
    await chooseColor(page, work, 'Blue')
    await work.locator('.buffer-color').click()
    const swatches = page.getByRole('menuitemradio').locator('span')
    const light = await swatches.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))

    await page.evaluate(() => window.heynote.themeMode.set('dark'))
    await expect(page.locator('html')).toHaveAttribute('theme', 'dark')
    await expect.poll(async () => {
        const dark = await swatches.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))
        return dark.every((color, index) => color !== light[index])
    }).toBe(true)
    const blue = await page.getByRole('menuitemradio', { name: 'Blue', exact: true }).locator('span').evaluate(element => getComputedStyle(element).backgroundColor)
    const red = await page.getByRole('menuitemradio', { name: 'Red', exact: true }).locator('span').evaluate(element => getComputedStyle(element).backgroundColor)
    await expect(page.locator('.status')).toHaveCSS('background-color', blue)
    await expect(work.locator('.buffer-color span')).toHaveCSS('background-color', blue)
    await expect(scratch.locator('.buffer-color span')).toHaveCSS('background-color', red)

    await page.keyboard.press('Escape')
    await scratch.locator('.title').click()
    await expect(page.locator('.status')).toHaveCSS('background-color', red)
    expect(heynote.getErrors()).toEqual([])
})

test('opening a picker activates its note and replaces the previous picker without losing edits', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await heynote.goto()
    await heynote.setContent('{"formatVersion":"2.0.0","name":"Scratch"}\n∞∞∞text\nKeep me')
    await chooseColor(page, page.locator('.tab-item.active'), 'Red')
    await createBuffer(page, 'Work')
    await page.locator('.cm-content').last().pressSequentially('Work in progress')
    const workPath = await page.evaluate(() => window._heynote_editor.path)
    await chooseColor(page, page.locator('.tab-item.active'), 'Blue')
    const blueUI = await uiColors(page)
    const work = page.locator('.tab-item').filter({ has: page.locator('.title', { hasText: /^Work$/ }) })

    const scratch = page.locator('.tab-item').filter({ has: page.locator('.title', { hasText: /^Scratch$/ }) })
    await work.locator('.buffer-color').click()
    await expect(page.getByRole('menu', { name: 'Color for Work', exact: true })).toBeVisible()
    await scratch.locator('.buffer-color').click()
    await expect(page.locator('.tab-item.active .title')).toHaveText('Scratch')
    await expect(page.locator('.status .note')).toHaveText('Scratch')
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'red')
    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect(page.getByRole('menu', { name: 'Color for Scratch', exact: true })).toBeVisible()
    await expect(work.locator('.buffer-color')).toHaveAttribute('aria-expanded', 'false')
    await page.getByRole('menuitemradio', { name: 'Orange', exact: true }).click()
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'orange')
    await work.locator('.title').click()
    expect(await uiColors(page)).toEqual(blueUI)
    expect(await heynote.getBlockContent(0)).toBe('Work in progress')

    // Keyboard activation must also replace the picker and load an uncached note.
    await page.reload()
    await expect(page.locator('.tab-item.active .title')).toHaveText('Work')
    await work.locator('.buffer-color').click()
    await expect(page.getByRole('menu', { name: 'Color for Work', exact: true })).toBeVisible()
    await scratch.locator('.buffer-color').focus()
    await scratch.locator('.buffer-color').press('Enter')
    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect(page.getByRole('menu', { name: 'Color for Scratch', exact: true })).toBeVisible()
    await expect(page.locator('.status .note')).toHaveText('Scratch')
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'orange')
    await expect(work.locator('.buffer-color')).toHaveAttribute('aria-expanded', 'false')
    await page.getByRole('menuitemradio', { name: 'Pink', exact: true }).click()
    await expect(page.getByRole('menu')).toHaveCount(0)
    expect(NoteFormat.load(await heynote.getStoredBuffer('scratch.txt')).content).toBe('\n∞∞∞text\nKeep me')
    expect(NoteFormat.load(await heynote.getStoredBuffer(workPath)).metadata.color).toBe('blue')

    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'pink')
    expect(await heynote.getBlockContent(0)).toBe('Keep me')
    await scratch.hover()
    await scratch.locator('.close').click()
    await page.locator('body').press(heynote.agnosticKey('Mod+Shift+t'))
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'pink')
    expect(heynote.getErrors()).toEqual([])
})

test('saved colors use gray for missing or unknown values, including the old grey ID and removed schemes', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await heynote.goto()
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'gray')
    await chooseColor(page, page.locator('.tab-item.active'), 'Red')
    for (const color of [undefined, 'grey', 'unknown', '__proto__', 'yellow', 'indigo', 'violet', 'teal']) {
        const note = new NoteFormat()
        note.metadata.name = 'Scratch'
        note.metadata.color = color
        note.content = '\n∞∞∞text\nLegacy note'
        await heynote.setContent(note.serialize())
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'gray')
        await expect(page.locator('.buffer-color')).toHaveAttribute('aria-label', 'Change color for Scratch (Gray)')
        await page.locator('.buffer-color').click()
        await expect(page.getByRole('menuitemradio')).toHaveCount(colors.length)
        expect(await page.getByRole('menuitemradio').evaluateAll(options => options.map(option => option.getAttribute('aria-label')))).toEqual(colors)
        await expect(page.getByRole('menuitemradio', { name: 'Gray', exact: true })).toHaveAttribute('aria-checked', 'true')
        await page.getByRole('menuitemradio', { name: 'Gray', exact: true }).click()
        await expect(page.getByRole('menu')).toHaveCount(0)
        const saved = NoteFormat.load(await heynote.getStoredBuffer('scratch.txt'))
        expect(saved.metadata.color).toBe('gray')
        expect(saved.content).toBe(note.content)
    }
    expect(heynote.getErrors()).toEqual([])
})

test('color picker supports keyboard selection, Escape, and outside dismissal', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await heynote.goto()
    const trigger = page.locator('.tab-item.active .buffer-color')
    await trigger.focus()
    await trigger.press('Enter')
    await expect(page.getByRole('menuitemradio', { name: 'Gray', exact: true })).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('menuitemradio', { name: 'Red', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'red')
    await expect(trigger).toBeFocused()
    await trigger.press('Space')
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByRole('menuitemradio', { name: 'Red', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.locator('.cm-content').click()
    await expect(page.getByRole('menu')).toHaveCount(0)
    expect(heynote.getErrors()).toEqual([])
})

for (const focus of ['trigger', 'menu']) {
    test(`global shortcuts work with the color picker ${focus} focused`, async ({ page }) => {
        const heynote = new HeynotePage(page)
        await heynote.goto()
        await createBuffer(page, 'Work')
        const trigger = page.locator('.tab-item.active .buffer-color')
        await chooseColor(page, page.locator('.tab-item.active'), 'Red')
        await expect(trigger).toBeFocused()

        async function focusPicker() {
            await trigger.click()
            await expect(page.getByRole('menuitemradio', { name: 'Red', exact: true })).toBeFocused()
            if (focus === 'trigger') {
                await page.keyboard.press('Escape')
                await expect(trigger).toBeFocused()
            }
        }

        if (focus === 'menu') await focusPicker()
        await page.keyboard.press(heynote.agnosticKey('Mod+p'))
        await expect(page.locator('.note-selector')).toBeVisible()
        await expect(page.getByRole('menu')).toHaveCount(0)
        await page.keyboard.press('Escape')

        await page.evaluate(() => window.heynote.setSettings({
            ...window.heynote.settings,
            keyBindings: [{ key: 'Alt-ArrowRight', command: 'openBufferSelector' }],
        }))
        await focusPicker()
        await page.keyboard.press('Alt+ArrowRight')
        await expect(page.locator('.note-selector')).toBeVisible()
        await expect(page.getByRole('menu')).toHaveCount(0)
        await page.keyboard.press('Escape')

        await focusPicker()
        await page.keyboard.press('Control+Shift+Tab')
        await expect(page.locator('.tab-item.active .title')).toHaveText('Scratch')
        await expect(page.getByRole('menu')).toHaveCount(0)

        await chooseColor(page, page.locator('.tab-item.active'), 'Red')
        if (focus === 'menu') await focusPicker()
        await page.keyboard.press(heynote.agnosticKey('Mod+w'))
        await expect(page.locator('.tab-item')).toHaveCount(1)
        await expect(page.locator('.tab-item.active .title')).toHaveText('Work')
        await expect(page.getByRole('menu')).toHaveCount(0)
        expect(heynote.getErrors()).toEqual([])
    })
}

test('color picker is available beside the title when tabs are hidden', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await heynote.goto()
    await heynote.setSettings({ ...(await heynote.getSettings()), showTabs: false })
    const title = page.locator('.tab-bar > .title')
    await chooseColor(page, title, 'Pink')
    await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'pink')
    expect(NoteFormat.load(await heynote.getStoredBuffer('scratch.txt')).metadata.color).toBe('pink')
    expect(heynote.getErrors()).toEqual([])
})

test('scheme syntax and UI overrides inherit by mode and reset when switching schemes', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await heynote.goto()
    await page.evaluate(async moduleUrl => {
        const { getColorScheme } = await import(moduleUrl)
        const red = getColorScheme('red')
        red.shared.syntax = { keyword: '#123456' }
        delete red.light.syntax.keyword
        delete red.dark.syntax.keyword
        red.light.ui.blockOdd = '#ffeedd'
        red.dark.syntax.string = '#fedcba'
        await window.heynote.themeMode.set('light')
    }, '/@fs/' + path.resolve('src/theme/schemes/index.js').replaceAll('\\', '/'))
    await heynote.setContent('{"formatVersion":"2.0.0","name":"Scratch","color":"gray"}\n∞∞∞javascript\nconst greeting = "hello";\nconst count = 42;\n∞∞∞text\nSecond block')
    const keyword = page.locator('.cm-content .cm-line span').filter({ hasText: /^const$/ }).first()
    const string = page.locator('.cm-content .cm-line span').filter({ hasText: /^"hello"$/ }).first()
    const number = page.locator('.cm-content .cm-line span').filter({ hasText: /^42$/ }).first()
    const tab = page.locator('.tab-item.active')

    await chooseColor(page, tab, 'Red')
    await expect(keyword).toHaveCSS('color', 'rgb(18, 52, 86)')
    await expect(string).toHaveCSS('color', rgb(resolveTheme(getColorScheme('red'), 'light').syntax.string))
    await expect(number).toHaveCSS('color', rgb(resolveTheme(getColorScheme('red'), 'light').syntax.number))
    await expect(page.locator('.block-odd')).toHaveCSS('background-color', 'rgb(255, 238, 221)')

    await page.evaluate(() => window.heynote.themeMode.set('dark'))
    await expect(keyword).toHaveCSS('color', 'rgb(18, 52, 86)')
    await expect(string).toHaveCSS('color', 'rgb(254, 220, 186)')
    await expect(number).toHaveCSS('color', rgb(resolveTheme(getColorScheme('red'), 'dark').syntax.number))
    await expect(page.locator('.block-odd')).toHaveCSS('background-color', 'rgb(54, 37, 34)')

    await chooseColor(page, tab, 'Blue')
    await expect(keyword).toHaveCSS('color', rgb(resolveTheme(getColorScheme('blue'), 'dark').syntax.keyword))
    await expect(string).toHaveCSS('color', rgb(resolveTheme(getColorScheme('blue'), 'dark').syntax.string))
    await page.evaluate(() => window.heynote.themeMode.set('light'))
    await expect(keyword).toHaveCSS('color', rgb(resolveTheme(getColorScheme('blue'), 'light').syntax.keyword))
    await expect(string).toHaveCSS('color', rgb(resolveTheme(getColorScheme('blue'), 'light').syntax.string))
    expect(heynote.getErrors()).toEqual([])
})

test('system mode resolves the correct UI and syntax defaults when the system appearance changes', async ({ page }) => {
    const heynote = new HeynotePage(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await heynote.goto()
    await page.evaluate(() => window.heynote.themeMode.set('system'))
    await heynote.setContent('{"formatVersion":"2.0.0","name":"Scratch"}\n∞∞∞javascript\nconst count = 42;')
    const keyword = page.locator('.cm-content .cm-line span').filter({ hasText: /^const$/ }).first()
    await expect(page.locator('html')).toHaveAttribute('theme', 'dark')
    await expect(keyword).toHaveCSS('color', rgb(resolveTheme(getColorScheme('gray'), 'dark').syntax.keyword))
    await expect(page.locator('.status')).toHaveCSS('background-color', 'rgb(80, 80, 80)')

    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('html')).toHaveAttribute('theme', 'light')
    await expect(keyword).toHaveCSS('color', rgb(resolveTheme(getColorScheme('gray'), 'light').syntax.keyword))
    await expect(page.locator('.status')).toHaveCSS('background-color', 'rgb(111, 111, 111)')
    expect(heynote.getErrors()).toEqual([])
})

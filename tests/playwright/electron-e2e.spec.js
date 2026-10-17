import { test, expect, _electron as electron } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { FileLibrary } from '../../electron/main/file-library'

import { HeynotePage } from "./test-utils.js"
import { NoteFormat } from "../../src/common/note-format.js"
import { resolveTheme } from "../../src/theme/resolve.js"
import { getColorScheme } from "../../src/theme/schemes/index.js"
import { parseImagesFromString } from "../../src/editor/image/image-parsing.js"


function rgb(hex) {
    return `rgb(${hex.slice(1).match(/../g).map(channel => parseInt(channel, 16)).join(', ')})`
}

async function ensureElectronBuild() {
    const mainPath = path.join(process.cwd(), 'dist-electron', 'main', 'index.js')
    const preloadPath = path.join(process.cwd(), 'dist-electron', 'preload', 'index.js')
    try {
        await fs.stat(mainPath)
        await fs.stat(preloadPath)
        return
    } catch {
        // build below
    }

    await new Promise((resolve, reject) => {
        const child = spawn('npx', ['vite', 'build'], {
            stdio: 'inherit',
            env: {
                ...process.env,
            },
        })
        child.on('error', reject)
        child.on('exit', (code) => {
            if (code === 0) {
                resolve()
                return
            }
            reject(new Error(`vite build failed with exit code ${code}`))
        })
    })
}

async function dirExists(path) {
    try {
        const stat = await fs.stat(path);
        return stat.isDirectory();
    } catch (err) {
        if (err.code === "ENOENT") return false;
        throw err; // other errors (permissions etc.)
    }
}

async function removeDirWithRetry(dirPath, retries = 5) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true })
            return
        } catch (err) {
            if (err.code !== "ENOTEMPTY" || attempt === retries) {
                throw err
            }
            await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)))
        }
    }
}


test.describe('electron app', { tag: "@e2e" }, () => {
    test.describe.configure({ mode: 'serial' });
    test.skip(({ browserName }) => browserName !== 'chromium', 'Electron runs only once under chromium')

    /**@type{HeynotePage}*/
    let heynotePage
    let electronApp
    let tmpRoot
    let userDataDir
    let page

    test.beforeEach(async ({ }) => {
        test.setTimeout(60000)
        await ensureElectronBuild()
        tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'heynote-e2e-'))
        userDataDir = path.join(tmpRoot, 'user-data')
        await fs.mkdir(userDataDir)

        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        page = await electronApp.firstWindow()
        await page.waitForLoadState('domcontentloaded')


        heynotePage = new HeynotePage(page)
        //await heynotePage.goto()
    })
    test.afterEach(async ({ page }) => {
        if (electronApp) {
            await electronApp.close()
        }
        if (await dirExists(tmpRoot)) {
            await removeDirWithRetry(tmpRoot)
        }
    })

    test('uses temp user data and notes library', async () => {
        await expect(page).toHaveTitle(/Heynote/i)

        const userData = await electronApp.evaluate(({ app }) => app.getPath('userData'))
        const notesDir = path.join(userData, 'notes')
        const scratchPath = path.join(notesDir, 'scratch.txt')
        const configPath = path.join(userData, 'config.json')

        await expect.poll(async () => {
            return await fs.stat(scratchPath).then(() => true).catch(() => false)
        }).toBe(true)

        await expect.poll(async () => {
            return await fs.stat(configPath).then(() => true).catch(() => false)
        }).toBe(true)

        const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
        expect(config.clientId).toBe('testing')

        expect(userData).toBe(userDataDir)
        expect(configPath.startsWith(userDataDir)).toBe(true)
        expect(notesDir.startsWith(userDataDir)).toBe(true)
    })

    test('buffer is saved to disk', async () => {
        //heynotePage.goto()
        //await page.waitForTimeout(3000)
        await expect.poll(async () => (await heynotePage.getBlocks()).length).toBeGreaterThan(0)
        //console.log("blocks:", await heynotePage.getBlocks())
        await page.locator(".cm-content").first().click()
        await page.locator("body").press(heynotePage.agnosticKey("Mod+A"))
        await page.locator("body").press(heynotePage.agnosticKey("Mod+A"))
        await page.locator("body").pressSequentially("Hello World!")
        await expect.poll(async () => await heynotePage.getBlockContent(0)).toBe("Hello World!")
        await heynotePage.waitForContentSaved()

        const library = new FileLibrary(path.join(userDataDir, 'notes'))
        const bufferContent = await library.load("scratch.txt")
        expect(bufferContent.endsWith("Hello World!")).toBeTruthy()
    })

    test('scratchpad colors persist in txt metadata across app restarts', async () => {
        await heynotePage.setContent('{"formatVersion":"2.0.0","name":"Scratch","custom":[42]}\n∞∞∞text\nKeep this content')
        await page.locator('.tab-item.active .buffer-color').click()
        await page.getByRole('menuitemradio', {name: 'Purple', exact: true}).click()
        await expect(page.getByRole('menu')).toHaveCount(0)

        const scratchPath = path.join(userDataDir, 'notes', 'scratch.txt')
        await expect.poll(async () => {
            return NoteFormat.load(await fs.readFile(scratchPath, 'utf8')).metadata.color
        }).toBe('purple')
        const saved = NoteFormat.load(await fs.readFile(scratchPath, 'utf8'))
        expect(saved.metadata).toMatchObject({name: 'Scratch', custom: [42]})
        expect(saved.content).toBe('\n∞∞∞text\nKeep this content')

        await page.locator('.add-tab').click()
        await page.locator('.note-selector .new-note').click()
        await page.locator('.new-buffer input[placeholder="Name"]').fill('Work')
        await page.locator('.new-buffer button[type="submit"]').click()
        await expect(page.locator('.tab-item.active .title')).toHaveText('Work')
        await page.locator('.tab-item.active .buffer-color').click()
        await page.getByRole('menuitemradio', {name: 'Blue', exact: true}).click()
        await expect(page.getByRole('menu')).toHaveCount(0)

        await electronApp.close()
        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {...process.env, HEYNOTE_TEST_USER_DATA_DIR: userDataDir},
        })
        page = await electronApp.firstWindow()
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'blue')
        await expect(page.locator('.tab-item.active .buffer-color')).toHaveAttribute('aria-label', 'Change color for Work (Blue)')

        // Scratch has no cached editor yet. Its dot comes from the on-disk metadata.
        const scratchTab = page.locator('.tab-item').filter({hasText: 'Scratch'})
        await expect(scratchTab.locator('.buffer-color')).toHaveAttribute('aria-label', 'Change color for Scratch (Purple)')
        await page.locator('.tab-item.active .buffer-color').click()
        await expect(page.getByRole('menu', {name: 'Color for Work', exact: true})).toBeVisible()
        await scratchTab.locator('.buffer-color').click()
        await expect(page.getByRole('menu')).toHaveCount(1)
        await expect(page.getByRole('menu', {name: 'Color for Scratch', exact: true})).toBeVisible()
        await expect(page.locator('.tab-item.active .title')).toHaveText('Scratch')
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'purple')
        await page.getByRole('menuitemradio', {name: 'Pink', exact: true}).click()
        await expect(page.getByRole('menu')).toHaveCount(0)
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'pink')
        await expect(page.locator('.status .note')).toHaveText('Scratch')
        expect(NoteFormat.load(await fs.readFile(scratchPath, 'utf8')).metadata.color).toBe('pink')

        await scratchTab.locator('.title').click()
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'pink')
        expect(await page.evaluate(() => window._heynote_editor.getContent())).toContain('Keep this content')
    })

    test('native light and dark changes apply the resolved UI and syntax palettes', async () => {
        // Use Electron's native appearance instead of Playwright's default light emulation.
        await page.emulateMedia({colorScheme: null})
        await heynotePage.setContent('{"formatVersion":"2.0.0","name":"Scratch","color":"blue"}\n∞∞∞javascript\nconst count = 42;\n∞∞∞text\nSecond block')
        const keyword = page.locator('.cm-content .cm-line span').filter({hasText: /^const$/}).first()
        const light = resolveTheme(getColorScheme('blue'), 'light')
        const dark = resolveTheme(getColorScheme('blue'), 'dark')

        await page.evaluate(() => window.heynote.themeMode.set('light'))
        await expect(page.locator('html')).toHaveAttribute('theme', 'light')
        await expect(keyword).toHaveCSS('color', rgb(light.syntax.keyword))
        await expect(page.locator('.block-odd')).toHaveCSS('background-color', rgb(light.ui.blockOdd))

        await page.evaluate(() => window.heynote.themeMode.set('dark'))
        await expect(page.locator('html')).toHaveAttribute('theme', 'dark')
        await expect(keyword).toHaveCSS('color', rgb(dark.syntax.keyword))
        await expect(page.locator('.block-odd')).toHaveCSS('background-color', rgb(dark.ui.blockOdd))

        await heynotePage.waitForContentSaved()
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('theme', 'dark')
        await expect(keyword).toHaveCSS('color', rgb(dark.syntax.keyword))
        await expect(page.locator('html')).toHaveAttribute('data-buffer-color', 'blue')
        await page.evaluate(() => window.heynote.themeMode.set('light'))
        await expect(keyword).toHaveCSS('color', rgb(light.syntax.keyword))
        expect(heynotePage.getErrors()).toEqual([])
    })

    test('pastes image data, stores it, and copy button writes image to clipboard', async () => {
        await expect.poll(async () => (await heynotePage.getBlocks()).length).toBeGreaterThan(0)

        await page.evaluate(async () => {
            const canvas = document.createElement("canvas")
            canvas.width = 300
            canvas.height = 300
            const ctx = canvas.getContext("2d")
            ctx.fillStyle = "#1e90ff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png")
            )
            const item = new ClipboardItem({ [blob.type]: blob })

            window.__testClipboardItems = [item]
            window.__clipboardWriteItems = []

            navigator.clipboard.read = async () => window.__testClipboardItems
            navigator.clipboard.write = async (items) => {
                window.__clipboardWriteItems = items
            }
        })

        await page.locator("body").press(heynotePage.agnosticKey("Mod+V"))

        await expect.poll(async () => {
            const content = await heynotePage.getContent()
            return parseImagesFromString(content)
        }).not.toHaveLength(0)

        await expect(page.locator(".heynote-image")).toHaveCount(1)

        const content = await heynotePage.getContent()
        const images = parseImagesFromString(content)
        expect(images).toHaveLength(1)
        expect(images[0].file.startsWith("heynote-file://image/")).toBe(true)

        const encodedName = images[0].file.replace("heynote-file://image/", "")
        const filename = decodeURIComponent(encodedName)
        const storedPath = path.join(userDataDir, "notes", ".images", filename)

        await expect.poll(async () => {
            return await fs.stat(storedPath).then((stat) => stat.size > 0).catch(() => false)
        }).toBe(true)
        //await page.waitForTimeout(100000)
        await page.evaluate(() => {
            const button = document.querySelector(".heynote-image .buttons-container button")
            if (!button) {
                throw new Error("Copy button not found")
            }
            button.click()
        })

        await expect.poll(async () => {
            const types = await page.evaluate(() => {
                return (window.__clipboardWriteItems || []).flatMap((item) => item.types)
            })
            return types.some((type) => type.startsWith("image/"))
        }).toBe(true)
    })
})

import { test, expect, _electron as electron } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { FileLibrary } from '../../electron/main/file-library'

import { HeynotePage } from "./test-utils.js"
import { parseImagesFromString } from "../../src/editor/image/image-parsing.js"


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

        expect(userData).toBe(userDataDir)
        expect(configPath.startsWith(userDataDir)).toBe(true)
        expect(notesDir.startsWith(userDataDir)).toBe(true)
    })

    test('buffer is saved to disk', async () => {
        //heynotePage.goto()
        //await page.waitForTimeout(3000)
        await expect.poll(async () => (await heynotePage.getBlocks()).length).toBeGreaterThan(0)
        //console.log("blocks:", await heynotePage.getBlocks())
        await page.locator("body").press(heynotePage.agnosticKey("Mod+A"))
        await page.locator("body").press(heynotePage.agnosticKey("Mod+A"))
        page.locator("body").pressSequentially("Hello World!")
        await expect.poll(async () => await heynotePage.getBlockContent(0)).toBe("Hello World!")
        await heynotePage.waitForContentSaved()

        const library = new FileLibrary(path.join(userDataDir, 'notes'))
        const bufferContent = await library.load("scratch.txt")
        expect(bufferContent.endsWith("Hello World!")).toBeTruthy()
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

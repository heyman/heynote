import { test, expect, _electron as electron } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { FileLibrary } from '../../electron/main/file-library'

import { HeynotePage } from "./test-utils.js"


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
            electronApp.close()
        }
        if (await dirExists(tmpRoot)) {
            await fs.rm(tmpRoot, { recursive: true, force: true })
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
})

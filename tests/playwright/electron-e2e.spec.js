import { test, expect, _electron as electron } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

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

test.describe('electron app', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Electron runs only once under chromium')

    test('uses temp user data and notes library', async () => {
        test.setTimeout(60000)
        await ensureElectronBuild()
        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'heynote-e2e-'))
        const userDataDir = path.join(tmpRoot, 'user-data')
        await fs.mkdir(userDataDir)

        const electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        try {
            const page = await electronApp.firstWindow()
            await page.waitForLoadState('domcontentloaded')
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
        } finally {
            await electronApp.close()
            await fs.rm(tmpRoot, { recursive: true, force: true })
        }
    })
})

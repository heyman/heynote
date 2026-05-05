import { test, expect, _electron as electron } from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

import { HeynotePage } from "./test-utils.js"

const isLinux = process.platform === 'linux'
const supportsOpenAtLogin = process.platform === 'darwin' || process.platform === 'win32'

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

async function dirExists(dirPath) {
    try {
        const stat = await fs.stat(dirPath)
        return stat.isDirectory()
    } catch (err) {
        if (err.code === "ENOENT") return false
        throw err
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

async function closeElectronApp(electronApp) {
    if (!electronApp) return
    const childProcess = electronApp.process()
    const hasExited = () => !childProcess || childProcess.exitCode !== null || childProcess.signalCode !== null
    const waitForExit = () => {
        if (hasExited()) {
            return Promise.resolve()
        }
        return new Promise((resolve) => childProcess.once('exit', resolve))
    }
    const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    await Promise.race([electronApp.close(), timeout(5000)])
    await Promise.race([waitForExit(), timeout(1000)])
    if (hasExited()) {
        return
    }

    // Force kill if still running, then wait so the next launch cannot race
    // against late config writes from this process.
    childProcess.kill('SIGKILL')
    await Promise.race([waitForExit(), timeout(5000)])
}


test.describe('openAtLogin e2e', { tag: "@e2e" }, () => {
    test.describe.configure({ mode: 'serial' })
    test.skip(({ browserName }) => browserName !== 'chromium', 'Electron runs only once under chromium')

    /** @type {HeynotePage} */
    let heynotePage
    let electronApp
    let tmpRoot
    let userDataDir
    let page

    test.beforeEach(async () => {
        test.setTimeout(60000)
        await ensureElectronBuild()
        tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'heynote-e2e-login-'))
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
    })

    test.afterEach(async () => {
        await closeElectronApp(electronApp)
        electronApp = null
        if (await dirExists(tmpRoot)) {
            await removeDirWithRetry(tmpRoot)
        }
    })

    test('Launch at login checkbox is visible in Electron', async () => {
        test.skip(!supportsOpenAtLogin, 'Launch at login is supported only on macOS/Windows')

        await expect(page).toHaveTitle(/Heynote/i)
        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Launch at login")
        await expect(checkbox).toBeVisible()
    })

    test('Launch at login checkbox is hidden in Electron on Linux', async () => {
        test.skip(!isLinux, 'Linux does not use Electron login item settings')

        await expect(page).toHaveTitle(/Heynote/i)
        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Launch at login")
        await expect(checkbox).toHaveCount(0)
    })

    test('Launch at login default is unchecked', async () => {
        test.skip(!supportsOpenAtLogin, 'Launch at login is supported only on macOS/Windows')

        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Launch at login")
        await expect(checkbox).not.toBeChecked()
    })

    test('Toggle Launch at login updates config file', async () => {
        test.skip(!supportsOpenAtLogin, 'Launch at login is supported only on macOS/Windows')

        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Launch at login")
        await checkbox.click()
        await expect(checkbox).toBeChecked()

        // Wait for config to be written to disk
        const configPath = path.join(userDataDir, 'config.json')
        await expect.poll(async () => {
            try {
                const raw = await fs.readFile(configPath, 'utf-8')
                const config = JSON.parse(raw)
                return config.settings?.openAtLogin
            } catch {
                return undefined
            }
        }).toBe(true)
    })

    test('Toggle Start hidden updates config file', async () => {
        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Start hidden")
        await checkbox.click()
        await expect(checkbox).toBeChecked()

        const configPath = path.join(userDataDir, 'config.json')
        await expect.poll(async () => {
            try {
                const raw = await fs.readFile(configPath, 'utf-8')
                const config = JSON.parse(raw)
                return config.settings?.startHidden
            } catch {
                return undefined
            }
        }).toBe(true)
    })

    test('Start hidden hides the window on startup', async () => {
        await closeElectronApp(electronApp)
        electronApp = null

        const configPath = path.join(userDataDir, 'config.json')
        await fs.writeFile(configPath, JSON.stringify({
            settings: {
                startHidden: true,
            },
        }))

        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        page = await electronApp.firstWindow()
        await page.waitForLoadState('domcontentloaded')

        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isVisible()
            })
        }).toBe(false)
    })

    test('Start hidden preserves saved fullscreen state when quitting while hidden', async () => {
        await closeElectronApp(electronApp)
        electronApp = null

        const configPath = path.join(userDataDir, 'config.json')
        await fs.writeFile(configPath, JSON.stringify({
            settings: {
                startHidden: true,
            },
            windowConfig: {
                isFullScreen: true,
            },
        }))

        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        page = await electronApp.firstWindow()
        await page.waitForLoadState('domcontentloaded')

        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isVisible()
            })
        }).toBe(false)

        await closeElectronApp(electronApp)
        electronApp = null

        await expect.poll(async () => {
            const raw = await fs.readFile(configPath, 'utf-8')
            const config = JSON.parse(raw)
            return config.windowConfig?.isFullScreen
        }).toBe(true)
    })

    test('Start hidden preserves saved maximized state when quitting while hidden', async () => {
        await closeElectronApp(electronApp)
        electronApp = null

        const configPath = path.join(userDataDir, 'config.json')
        await fs.writeFile(configPath, JSON.stringify({
            settings: {
                startHidden: true,
            },
            windowConfig: {
                isMaximized: true,
            },
        }))

        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        page = await electronApp.firstWindow()
        await page.waitForLoadState('domcontentloaded')

        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isVisible()
            })
        }).toBe(false)

        await closeElectronApp(electronApp)
        electronApp = null

        await expect.poll(async () => {
            const raw = await fs.readFile(configPath, 'utf-8')
            const config = JSON.parse(raw)
            return config.windowConfig?.isMaximized
        }).toBe(true)
    })

    test('Start hidden saves updated maximized state after showing and hiding again', async () => {
        await closeElectronApp(electronApp)
        electronApp = null

        const configPath = path.join(userDataDir, 'config.json')
        await fs.writeFile(configPath, JSON.stringify({
            settings: {
                startHidden: true,
            },
            windowConfig: {
                isMaximized: true,
            },
        }))

        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        page = await electronApp.firstWindow()
        await page.waitForLoadState('domcontentloaded')

        await electronApp.evaluate(({ BrowserWindow }) => {
            BrowserWindow.getAllWindows()[0].show()
        })
        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isVisible()
            })
        }).toBe(true)
        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isMaximized()
            })
        }).toBe(true)

        await electronApp.evaluate(({ BrowserWindow }) => {
            BrowserWindow.getAllWindows()[0].unmaximize()
        })
        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isMaximized()
            })
        }).toBe(false)

        await electronApp.evaluate(({ BrowserWindow }) => {
            BrowserWindow.getAllWindows()[0].hide()
        })
        await closeElectronApp(electronApp)
        electronApp = null

        await expect.poll(async () => {
            const raw = await fs.readFile(configPath, 'utf-8')
            const config = JSON.parse(raw)
            return config.windowConfig?.isMaximized
        }).toBe(false)
    })

    test('Start hidden saves updated fullscreen state after showing and hiding again', async () => {
        await closeElectronApp(electronApp)
        electronApp = null

        const configPath = path.join(userDataDir, 'config.json')
        await fs.writeFile(configPath, JSON.stringify({
            settings: {
                startHidden: true,
            },
            windowConfig: {
                isFullScreen: true,
            },
        }))

        electronApp = await electron.launch({
            args: ['--no-sandbox', 'tests/playwright/electron-runner.cjs'],
            env: {
                ...process.env,
                HEYNOTE_TEST_USER_DATA_DIR: userDataDir,
            },
        })

        page = await electronApp.firstWindow()
        await page.waitForLoadState('domcontentloaded')

        await electronApp.evaluate(({ BrowserWindow }) => {
            BrowserWindow.getAllWindows()[0].show()
        })
        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isVisible()
            })
        }).toBe(true)
        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isFullScreen()
            })
        }).toBe(true)

        await electronApp.evaluate(({ BrowserWindow }) => {
            BrowserWindow.getAllWindows()[0].setFullScreen(false)
        })
        await expect.poll(async () => {
            return await electronApp.evaluate(({ BrowserWindow }) => {
                return BrowserWindow.getAllWindows()[0]?.isFullScreen()
            })
        }).toBe(false)

        await electronApp.evaluate(({ BrowserWindow }) => {
            BrowserWindow.getAllWindows()[0].hide()
        })
        await closeElectronApp(electronApp)
        electronApp = null

        await expect.poll(async () => {
            const raw = await fs.readFile(configPath, 'utf-8')
            const config = JSON.parse(raw)
            return config.windowConfig?.isFullScreen
        }).toBe(false)
    })

    test('Toggle Launch at login updates Electron loginItemSettings', async () => {
        test.skip(!supportsOpenAtLogin, 'Launch at login is supported only on macOS/Windows')

        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Launch at login")
        await checkbox.click()
        await expect(checkbox).toBeChecked()

        // Verify Electron's loginItemSettings
        const loginSettings = await electronApp.evaluate(({ app }) => {
            return app.getLoginItemSettings()
        })
        expect(loginSettings.openAtLogin).toBe(true)
    })

    test('Toggle Launch at login off resets loginItemSettings', async () => {
        test.skip(!supportsOpenAtLogin, 'Launch at login is supported only on macOS/Windows')

        await page.locator("css=.status-block.settings").click()
        await expect(page.locator("css=.overlay .settings .dialog")).toBeVisible()
        const checkbox = page.getByLabel("Launch at login")

        // Toggle on
        await checkbox.click()
        await expect(checkbox).toBeChecked()

        // Toggle off
        await checkbox.click()
        await expect(checkbox).not.toBeChecked()

        // Verify Electron's loginItemSettings is reset
        const loginSettings = await electronApp.evaluate(({ app }) => {
            return app.getLoginItemSettings()
        })
        expect(loginSettings.openAtLogin).toBe(false)
    })

    test('windowConfig.visibleOnQuit is saved on app close', async () => {
        // The window is visible, so closing should save visibleOnQuit: true.
        const configPath = path.join(userDataDir, 'config.json')

        // Close the app gracefully
        await closeElectronApp(electronApp)
        electronApp = null

        // Read config and verify visibleOnQuit was saved.
        await expect.poll(async () => {
            try {
                const raw = await fs.readFile(configPath, 'utf-8')
                const config = JSON.parse(raw)
                return config.windowConfig?.visibleOnQuit
            } catch {
                return undefined
            }
        }).toBe(true)
    })
})

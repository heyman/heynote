import { app, BrowserWindow, Tray, shell, ipcMain, Menu, nativeTheme, globalShortcut, nativeImage, screen } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import fs from "fs"

import { menu, getTrayMenu } from './menu'
import { WINDOW_CLOSE_EVENT, SETTINGS_CHANGE_EVENT } from '../constants';
import CONFIG from "../config"
import { isDev, isLinux, isMac, isWindows } from '../detect-platform';
import { initializeAutoUpdate, checkForUpdates } from './auto-update';
import { fixElectronCors } from './cors';
import { loadBuffer, contentSaved } from './buffer';


// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (isWindows) app.setAppUserModelId(app.getName())

if (!process.env.VITE_DEV_SERVER_URL && !app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

// Set custom application menu
Menu.setApplicationMenu(menu)


// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export let win: BrowserWindow | null = null
let tray: Tray | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

let currentKeymap = CONFIG.get("settings.keymap")

// if this version is a beta version, set the release channel to beta
const isBetaVersion = app.getVersion().includes("beta")
if (isBetaVersion) {
    CONFIG.set("settings.allowBetaVersions", true)
}

let forceQuit = false
export function setForceQuit() {
    forceQuit = true
}
export function quit() {
    setForceQuit()
    app.quit()
}


async function createWindow() {
    // read any stored window settings from config, or use defaults
    let windowConfig = {
        width: CONFIG.get("windowConfig.width", 900) as number,
        height: CONFIG.get("windowConfig.height", 680) as number,
        isMaximized: CONFIG.get("windowConfig.isMaximized", false) as boolean,
        isFullScreen: CONFIG.get("windowConfig.isFullScreen", false) as boolean,
        x: CONFIG.get("windowConfig.x"),
        y: CONFIG.get("windowConfig.y"),
    }

    // windowConfig.x and windowConfig.y will be undefined when config file is missing, e.g. first time run
    if (windowConfig.x !== undefined && windowConfig.y !== undefined) {
        // check if window is outside of screen, or too large
        const area = screen.getDisplayMatching({
            x: windowConfig.x,
            y: windowConfig.y,
            width: windowConfig.width,
            height: windowConfig.height,
        }).workArea
        if (windowConfig.width > area.width) {
            windowConfig.width = area.width
        }
        if (windowConfig.height > area.height) {
            windowConfig.height = area.height
        }
        if (windowConfig.x + windowConfig.width > area.width || windowConfig.y + windowConfig.height > area.height) {
            // window is outside of screen, reset position
            windowConfig.x = undefined
            windowConfig.y = undefined
        }
    }

    win = new BrowserWindow(Object.assign({
        title: 'heynote',
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#262B37' : '#FFFFFF',
        //titleBarStyle: 'customButtonsOnHover',
        autoHideMenuBar: true,
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: true,
        },
    }, windowConfig))

    // maximize window if it was maximized last time
    if (windowConfig.isMaximized) {
        win.maximize()
    }
    if (windowConfig.isFullScreen) {
        win.setFullScreen(true)
    }

    win.on("close", (event) => {
        if (!forceQuit && CONFIG.get("settings.showInMenu")) {
            event.preventDefault()
            win.hide()
            return
        }
        // Prevent the window from closing, and send a message to the renderer which will in turn
        // send a message to the main process to save the current buffer and close the window.
        if (!contentSaved) {
            event.preventDefault()
            win?.webContents.send(WINDOW_CLOSE_EVENT)
        } else {
            // save window config
            Object.assign(windowConfig, {
                isMaximized: win.isMaximized(),
                isFullScreen: win.isFullScreen(),
            }, win.getNormalBounds())
            CONFIG.set("windowConfig", windowConfig)
        }
    })

    win.on("hide", () => {
        if (isWindows && CONFIG.get("settings.showInMenu")) {
            win.setSkipTaskbar(true)
        }
    })

    win.on("show", () => {
        if (isWindows && CONFIG.get("settings.showInMenu")) {
            win.setSkipTaskbar(false)
        }
    })

    nativeTheme.themeSource = CONFIG.get("theme")

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        win.loadURL(url + '?dev=1')
        // Open devTool if the app is not packaged
        //win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
        //win.webContents.openDevTools()
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url)
        }
        return {action: 'deny'}
    })

    fixElectronCors(win)
}

function createTray() {
    let img
    if (isMac) {
        img = nativeImage.createFromPath(join(process.env.PUBLIC, "iconTemplate.png"))
    } else if (isLinux) {
        img = nativeImage.createFromPath(join(process.env.PUBLIC, 'favicon-linux.png'));
    } else{
        img = nativeImage.createFromPath(join(process.env.PUBLIC, 'favicon.ico'));
    }
    tray = new Tray(img);
    tray.setToolTip("Heynote");
    const menu = getTrayMenu(win)
    if (isMac) {
        // using tray.setContextMenu() on macOS will open the menu on left-click, so instead we'll
        // manually bind the right-click event to open the menu
        tray.addListener("right-click", () => {
            tray?.popUpContextMenu(menu)
        })
    } else {
        tray.setContextMenu(menu);
    }
    tray.addListener("click", () => {
        win?.show()
    })
}

function registerGlobalHotkey() {
    globalShortcut.unregisterAll()
    if (CONFIG.get("settings.enableGlobalHotkey")) {
        try {
            const ret = globalShortcut.register(CONFIG.get("settings.globalHotkey"), () => {
                if (!win) {
                    return
                }
                if (win.isFocused()) {
                    if (isMac) {
                        // app.hide() only available on macOS
                        // We want to use app.hide() so that the menu bar also gets changed
                        app?.hide()
                        if (CONFIG.get("settings.alwaysOnTop")) {
                            // if alwaysOnTop is on, calling app.hide() won't hide the window
                            win.hide()
                        }
                    } else if (isLinux) {
                        win.blur()
                        // If we don't hide the window, it will stay on top of the stack even though it's not visible
                        // and pressing the hotkey again won't do anything
                        win.hide()
                    } else {
                        win.blur()
                        if (CONFIG.get("settings.showInMenu") || CONFIG.get("settings.alwaysOnTop")) {
                            // if we're using a tray icon, or alwaysOnTop is on, we want to completely hide the window
                            win.hide()
                        }
                    }
                } else {
                    app.focus({steal: true})
                    if (win.isMinimized()) {
                        win.restore()
                    }
                    if (!win.isVisible()) {
                        win.show()
                    }

                    win.focus()
                }
            })
        } catch (error) {
            console.log("Could not register global hotkey:", error)
        }
    }
}

function registerShowInDock() {
    // dock is only available on macOS
    if (isMac) {
        if (CONFIG.get("settings.showInDock")) {
            app.dock.show().catch((error) => {
                console.log("Could not show app in dock: ", error);
            });
        } else {
            app.dock.hide();
        }
    }
}

function registerShowInMenu() {
    if (CONFIG.get("settings.showInMenu")) {
        createTray()
    } else {
        tray?.destroy()
    }
}

function registerAlwaysOnTop() {
    if (CONFIG.get("settings.alwaysOnTop")) {
        const disableAlwaysOnTop = () => {
            win.setAlwaysOnTop(true, "floating");
            win.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
            win.setFullScreenable(false);
        }
        // if we're in fullscreen mode, we need to exit fullscreen before we can set alwaysOnTop
        if (win.isFullScreen()) {
            // on Mac setFullScreen happens asynchronously, so we need to wait for the event before we can disable alwaysOnTop
            win.once("leave-full-screen", disableAlwaysOnTop)
            win.setFullScreen(false)
        } else {
            disableAlwaysOnTop()
        }
    } else {
        win.setAlwaysOnTop(false);
        win.setVisibleOnAllWorkspaces(false);
        win.setFullScreenable(true);
    }
}

app.whenReady().then(createWindow).then(async () => {
    initializeAutoUpdate(win)
    registerGlobalHotkey()
    registerShowInDock()
    registerShowInMenu()
    registerAlwaysOnTop()
})

app.on("before-quit", () => {
    // if CMD+Q is pressed, we want to quit the app even if we're using a Menu/Tray icon
    setForceQuit()
})

app.on('window-all-closed', () => {
    win = null
    if (!isMac) app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

ipcMain.handle('dark-mode:set', (event, mode) => {
    CONFIG.set("theme", mode)
    nativeTheme.themeSource = mode
})

ipcMain.handle('dark-mode:get', () => nativeTheme.themeSource)

// load buffer on app start
loadBuffer()


ipcMain.handle('settings:set', async (event, settings) => {
    if (settings.keymap !== CONFIG.get("settings.keymap")) {
        currentKeymap = settings.keymap
    }
    let globalHotkeyChanged = settings.enableGlobalHotkey !== CONFIG.get("settings.enableGlobalHotkey") || settings.globalHotkey !== CONFIG.get("settings.globalHotkey")
    let showInDockChanged = settings.showInDock !== CONFIG.get("settings.showInDock");
    let showInMenuChanged = settings.showInMenu !== CONFIG.get("settings.showInMenu");
    let bufferPathChanged = settings.bufferPath !== CONFIG.get("settings.bufferPath");
    let alwaysOnTopChanged = settings.alwaysOnTop !== CONFIG.get("settings.alwaysOnTop");
    CONFIG.set("settings", settings)

    win?.webContents.send(SETTINGS_CHANGE_EVENT, settings)

    if (globalHotkeyChanged) {
        registerGlobalHotkey()
    }
    if (showInDockChanged) {
        registerShowInDock()
    }
    if (showInMenuChanged) {
        registerShowInMenu()
    }
    if (alwaysOnTopChanged) {
        registerAlwaysOnTop()
    }
    if (bufferPathChanged) {
        const buffer = loadBuffer()
        if (buffer.exists()) {
            win?.webContents.send("buffer-content:change", await buffer.load())
        }
    }
})

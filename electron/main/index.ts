import { app, BrowserWindow, shell, ipcMain, Menu, nativeTheme, globalShortcut } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import * as jetpack from "fs-jetpack";

import menu from './menu'
import { initialContent, initialDevContent } from '../initial-content'
import { WINDOW_CLOSE_EVENT, SETTINGS_CHANGE_EVENT } from '../constants';
import CONFIG from "../config"
import { onBeforeInputEvent } from "../keymap"
import { isMac } from '../detect-platform';
import { initializeAutoUpdate } from './auto-update';
import { fixElectronCors } from './cors';


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
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

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
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')
const isDev = !!process.env.VITE_DEV_SERVER_URL

let currentKeymap = CONFIG.get("settings.keymap")
let contentSaved = false


async function createWindow() {
    // read any stored window settings from config, or use defaults
    let windowConfig = {
        width: CONFIG.get("windowConfig.width", 900) as number,
        height: CONFIG.get("windowConfig.height", 680) as number,
        isMaximized: CONFIG.get("windowConfig.isMaximized", false) as boolean,
        isFullScreen: CONFIG.get("windowConfig.isFullScreen", false) as boolean,
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

    nativeTheme.themeSource = CONFIG.get("theme")

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        win.loadURL(url + '?dev=1')
        // Open devTool if the app is not packaged
        //win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
        //win.webContents.openDevTools()
    }
    
    // custom keyboard shortcuts for Emacs keybindings
    win.webContents.on("before-input-event", function (event, input) {
        onBeforeInputEvent({event, input, win, currentKeymap})
    })

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url)
        }
        return { action: 'deny' }
    })

    fixElectronCors(win)
}

app.whenReady().then(createWindow).then(async () => {
    initializeAutoUpdate(win)
})

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
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

const bufferPath = isDev ? join(app.getPath("userData"), "buffer-dev.txt") : join(app.getPath("userData"), "buffer.txt")

ipcMain.handle('buffer-content:load', async () =>  {
    if (jetpack.exists(bufferPath) === "file") {
        return await jetpack.read(bufferPath, 'utf8')
    } else {
        return isDev? initialDevContent : initialContent
    }
});

async function save(content) {
    return await jetpack.write(bufferPath, content, {
        atomic: true,
        mode: '600',
    })
}

ipcMain.handle('buffer-content:save', async (event, content) =>  {
    return await save(content)
});

ipcMain.handle('buffer-content:saveAndQuit', async (event, content) => {
    await save(content)
    contentSaved = true
    app.quit()
})

ipcMain.handle('settings:set', (event, settings) =>  {
    if (settings.keymap !== CONFIG.get("keymap")) {
        currentKeymap = settings.keymap
    }
    CONFIG.set("settings", settings)
    win?.webContents.send(SETTINGS_CHANGE_EVENT, settings)
})

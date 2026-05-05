import { app, BrowserWindow, Tray, shell, ipcMain, Menu, nativeTheme, globalShortcut, nativeImage, screen } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import fs from "fs"

import { 
    WINDOW_CLOSE_EVENT, WINDOW_FULLSCREEN_STATE, WINDOW_FOCUS_STATE, FOCUS_EDITOR_EVENT, SETTINGS_CHANGE_EVENT,
    TITLE_BAR_BG_LIGHT, TITLE_BAR_BG_LIGHT_BLURRED, TITLE_BAR_BG_DARK, TITLE_BAR_BG_DARK_BLURRED,
    SCRATCH_FILE_NAME, SAVE_TABS_STATE, LOAD_TABS_STATE, CONTEXT_MENU_CLOSED, GET_SYSTEM_LOCALE,
    LIBRARY_SEARCH_START, LIBRARY_SEARCH_CANCEL, LIBRARY_SEARCH_MATCH, LIBRARY_SEARCH_DONE, LIBRARY_SEARCH_ERROR,
} from '@/src/common/constants'

import { menu, getTrayMenu, getEditorContextMenu, getTabContextMenu, getBufferTreeContextMenu, getBufferTreeDirectoryContextMenu, getBufferTreeBackgroundContextMenu, getSpellcheckingContextMenu } from './menu'
import CONFIG from "../config"
import { isDev, isLinux, isMac, isWindows } from '../detect-platform';
import { initializeAutoUpdate, checkForUpdates, updateAutoInstallUpdates } from './auto-update';
import { fixElectronCors } from './cors';
import { 
    FileLibrary, 
    setupFileLibraryEventHandlers, 
    setCurrentFileLibrary, 
    migrateBufferFileToLibrary, 
    NOTES_DIR_NAME 
} from './file-library';
import { registerProtocol, registerProtocolBeforeAppReady } from "./protocol.js"
import { startLibrarySearch } from "./ripgrep.js"


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
let fileLibrary: FileLibrary | null = null
let currentLibrarySearch: any = null
let tray: Tray | null = null;
let initErrors: string[] = []
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')
const OPEN_AT_LOGIN_ARG = "--heynote-open-at-login"

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

function showWindow() {
    if (!win) {
        return
    }
    const wasVisible = win.isVisible()
    if (win.isMinimized()) {
        win.restore()
    }
    if (!wasVisible) {
        // hide()+show() forces the window to the top of the window stack on
        // Linux WMs that don't raise windows on a bare show() call
        if (isLinux) {
            win.hide()
        }
        win.show()
    }
    app.focus({ steal: true })
    win.focus()
    if (!wasVisible) {
        // when a window is hidden, it seems like which element is focused is forgotten, so this
        // forces focus to the editor (otherwise the sidebar would get focus if it's visible)
        win.webContents.send(FOCUS_EDITOR_EVENT)
    }
}

function wasOpenedAtLogin() {
    if (isMac) {
        return app.getLoginItemSettings().wasOpenedAtLogin
    }
    if (isWindows) {
        return process.argv.includes(OPEN_AT_LOGIN_ARG)
    }
    return false
}

async function createWindow() {
    // read any stored window settings from config, or use defaults
    let windowBounds = {
        width: CONFIG.get("windowConfig.width", 940) as number,
        height: CONFIG.get("windowConfig.height", 720) as number,
        x: CONFIG.get("windowConfig.x"),
        y: CONFIG.get("windowConfig.y"),
    }
    const windowWasMaximized = CONFIG.get("windowConfig.isMaximized", false) as boolean
    const windowWasFullScreen = CONFIG.get("windowConfig.isFullScreen", false) as boolean
    const windowWasVisibleOnQuit = CONFIG.get("windowConfig.visibleOnQuit", true)
    const startHidden = CONFIG.get("settings.startHidden", false) as boolean
    const hideOnStartup = startHidden || (wasOpenedAtLogin() && !windowWasVisibleOnQuit)
    let currentWindowIsMaximized = windowWasMaximized
    let currentWindowIsFullScreen = windowWasFullScreen

    // windowBounds.x and windowBounds.y will be undefined when config file is missing, e.g. first time run
    if (windowBounds.x !== undefined && windowBounds.y !== undefined) {
        // check if window is outside of screen, or too large
        const display = screen.getDisplayMatching({
            x: windowBounds.x,
            y: windowBounds.y,
            width: windowBounds.width,
            height: windowBounds.height,
        })
        //console.log("bounds:", display.bounds, "workArea:", display.workArea)
        const area = display.workArea
        if (windowBounds.width > area.width) {
            windowBounds.width = area.width
        }
        if (windowBounds.height > area.height) {
            windowBounds.height = area.height
        }
        if (windowBounds.x + windowBounds.width > area.x + area.width || windowBounds.y + windowBounds.height > area.y + area.height) {
            // window is outside of screen, reset position
            windowBounds.x = undefined
            windowBounds.y = undefined
        }
    }

    const pngSystems: NodeJS.Platform[] = ["linux", "freebsd", "openbsd", "netbsd"]
    const icon = join(
        process.env.PUBLIC,
        pngSystems.includes(process.platform)
            ? "favicon-linux.png"
            : "favicon.ico",
    )

    // set initial theme mode
    nativeTheme.themeSource = CONFIG.get("theme")

    win = new BrowserWindow(Object.assign({
        title: 'heynote',
        icon,
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#262B37' : '#FFFFFF',
        accentColor: undefined,
        show: !hideOnStartup,
        // We can't set fullscreen:true when hideOnStartup is true, because it will cancel out the show:false option
        // instead we fullscreen the window the first time it is shown
        // (see https://github.com/electron/electron/issues/42165)
        ...(!hideOnStartup && windowWasFullScreen ? { fullscreen: true } : {}),
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
        titleBarStyle: "hidden" as const, // customButtonsOnHover
        trafficLightPosition: { x: 8, y: 8 },
        ...(!isMac ? {
            titleBarOverlay: {
                color: nativeTheme.shouldUseDarkColors ? TITLE_BAR_BG_DARK : TITLE_BAR_BG_LIGHT,
                symbolColor: nativeTheme.shouldUseDarkColors ? '#aaa' : '#333',
            }, 
        } : {})
    }, windowBounds))

    win.on("maximize", () => {
        currentWindowIsMaximized = true
    })
    win.on("unmaximize", () => {
        currentWindowIsMaximized = false
    })
    
    win.on("enter-full-screen", () => {
        currentWindowIsFullScreen = true
        win?.webContents.send(WINDOW_FULLSCREEN_STATE, true)
    })
    win.on("leave-full-screen", () => {
        currentWindowIsFullScreen = false
        win?.webContents.send(WINDOW_FULLSCREEN_STATE, false)
    })

    win.on("close", (event) => {
        if (!forceQuit && CONFIG.get("settings.showInMenu")) {
            event.preventDefault()
            win.hide()
            return
        }

        // Save window config
        CONFIG.set("windowConfig", {
            ...win.getNormalBounds(),
            isMaximized: currentWindowIsMaximized,
            isFullScreen: currentWindowIsFullScreen,
            visibleOnQuit: win.isVisible(),
        })

        // Prevent the window from closing, and send a message to the renderer which will in turn
        // send a message to the main process to save the current buffer and close the window.
        if (!!fileLibrary && !fileLibrary.contentSaved) {
            event.preventDefault()
            win?.webContents.send(WINDOW_CLOSE_EVENT)
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

    if (hideOnStartup) {
        win.once("show", () => {
            if (windowWasMaximized) {
                win?.maximize()
            }
            if (windowWasFullScreen && !win?.isFullScreen()) {
                win?.setFullScreen(true)
            }
        })
    }
    // maximize window if it was maximized last time
    if (windowWasMaximized && !hideOnStartup) {
        win.maximize()
    }


    // when app gets focused, show the window if it's hidden
    // without this, there are cases when Cmd-Tabbing to Heynote won't show the window
    app.on("did-become-active", (event) => {
        if (!win.isVisible()) {
            win.show()
        }
    })

    win.on("focus", () => {
        // send a message to the renderer to update the window title
        win?.webContents.send(WINDOW_FOCUS_STATE, true)

        // update titleBarOverlay colors on Windows/Linux
        if (!isMac) {
            win?.setTitleBarOverlay({
                color: nativeTheme.shouldUseDarkColors ? TITLE_BAR_BG_DARK : TITLE_BAR_BG_LIGHT,
                symbolColor: nativeTheme.shouldUseDarkColors ? '#aaa' : '#333',
            })
        }
    })
    win.on("blur", () => {
        // send a message to the renderer to update the window title
        win?.webContents.send(WINDOW_FOCUS_STATE, false)

        // update titleBarOverlay colors on Windows/Linux
        if (!isMac) {
            win?.setTitleBarOverlay({
                color: nativeTheme.shouldUseDarkColors ? TITLE_BAR_BG_DARK_BLURRED : TITLE_BAR_BG_LIGHT_BLURRED,
                symbolColor: nativeTheme.shouldUseDarkColors ? '#aaa' : '#333',
            })
        }
    })

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
        win?.webContents.send(WINDOW_FULLSCREEN_STATE, win?.isFullScreen())
        win?.webContents.send(WINDOW_FOCUS_STATE, win?.isFocused())
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
    const menu = getTrayMenu(win, showWindow)
    if (isLinux) {
        // Linux tray implementations don't reliably emit right-click events, so
        // setContextMenu is needed for the context menu to be accessible.
        tray.setContextMenu(menu)
    } else {
        // On macOS and Windows: right-click opens the menu via popUpContextMenu.
        // (setContextMenu() would intercept left-click on Windows, so we avoid it)
        tray.addListener("right-click", () => {
            tray?.popUpContextMenu(menu)
        })
    }
    // Left-click toggles the window on all platforms where click events are emitted
    tray.addListener("click", () => {
        if (win?.isVisible()) {
            win.hide()
        } else {
            showWindow()
        }
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
                        win.hide()
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
                    showWindow()
                }
            })
        } catch (error) {
            console.log("Could not register global hotkey:", error)
        }
    }
}

function setDockVisibility(visible) {
    if (visible) {
        //console.log("showing in dock")
        app.dock.show().catch((error) => {
            console.log("Could not show app in dock: ", error);
        });
        //app.setActivationPolicy("regular");
    } else {
        //console.log("hiding from dock")
        app.dock.hide()
        //app.setActivationPolicy("accessory")
    }
}

function registerShowInDock() {
    // dock is only available on macOS
    if (isMac) {
        if (CONFIG.get("settings.showInDock")) {
            setDockVisibility(true)
        } else {
            setDockVisibility(false)
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

function registerOpenAtLogin() {
    if (!isMac && !isWindows) {
        return
    }
    const openAtLogin = CONFIG.get("settings.openAtLogin") as boolean
    app.setLoginItemSettings(isWindows ? {
        openAtLogin,
        args: openAtLogin ? [OPEN_AT_LOGIN_ARG] : [],
    } : { openAtLogin })
}

function registerAlwaysOnTop() {
    if (CONFIG.get("settings.alwaysOnTop")) {
        const setAlwaysOnTop = () => {
            win.setAlwaysOnTop(true, "floating");
            win.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true, skipTransformProcessType:true});
            win.setFullScreenable(false);

            // Ensure the Dock icon remains visible on macOS
            if (isMac && CONFIG.get("settings.showInDock")) {
                setDockVisibility(true)
            }

            // windows looses focus (on Mac)
            win.focus()
        }
        // if we're in fullscreen mode, we need to exit fullscreen before we can set alwaysOnTop
        if (win.isFullScreen()) {
            // on Mac setFullScreen happens asynchronously, so we need to wait for the event before we can disable alwaysOnTop
            win.once("leave-full-screen", setAlwaysOnTop)
            win.setFullScreen(false)
        } else {
            setAlwaysOnTop()
        }
    } else {
        win.setAlwaysOnTop(false);

        // without skipTransformProcessType, the window dock icon will re-appear on Mac if showInDock is false, 
        // and calling app.dock.hide() immediately after this call won't fix it
        win.setVisibleOnAllWorkspaces(false, {skipTransformProcessType:true});
        
        win.setFullScreenable(true);
    }
}

// register heynote-file:// protocol
registerProtocolBeforeAppReady()

app.whenReady().then(createWindow).then(async () => {
    initFileLibrary(win).then(() => {
        setupFileLibraryEventHandlers()
    })
    initializeAutoUpdate(win)
    registerGlobalHotkey()
    registerShowInDock()
    registerShowInMenu()
    registerAlwaysOnTop()
    registerOpenAtLogin()
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
    showWindow()
})

app.on('activate', () => {
    if (win) {
        showWindow()
    } else {
        createWindow()
    }
})

ipcMain.handle('dark-mode:set', (event, mode) => {
    CONFIG.set("theme", mode)
    nativeTheme.themeSource = mode

    // update titleBarOverlay colors on Windows/Linux
    if (!isMac) {
        win?.setTitleBarOverlay({
            color: nativeTheme.shouldUseDarkColors ? TITLE_BAR_BG_DARK : TITLE_BAR_BG_LIGHT,
            symbolColor: nativeTheme.shouldUseDarkColors ? '#aaa' : '#333',
        })
    }
})

ipcMain.handle('dark-mode:get', () => nativeTheme.themeSource)

ipcMain.handle("setWindowTitle", (event, title) => {
    win?.setTitle(title)
})

ipcMain.handle("showEditorContextMenu", () =>  {
    getEditorContextMenu(win).popup({window:win});
})

ipcMain.handle("showMainMenu", (event, x, y) =>  {
    //console.log("showMainMenu", x , y)
    menu.popup({
        window: win,
        x: x,
        y: y,
    });
})

ipcMain.handle("showTabContextMenu", (event, tabPath) =>  {
    const menu = getTabContextMenu(win, tabPath)
    menu.once("menu-will-close", () => {
        win?.webContents.send(CONTEXT_MENU_CLOSED)
    })
    menu.popup({window: win});
})

ipcMain.handle("showBufferTreeContextMenu", (event, bufferPath) => {
    const menu = getBufferTreeContextMenu(win, bufferPath)
    menu.once("menu-will-close", () => {
        win?.webContents.send(CONTEXT_MENU_CLOSED)
    })
    menu.popup({ window: win })
})

ipcMain.handle("showBufferTreeDirectoryContextMenu", async (event, directoryPath) => {
    const isEmptyDirectory = directoryPath ? await fileLibrary?.isDirectoryEmpty(directoryPath) : false
    const menu = getBufferTreeDirectoryContextMenu(win, directoryPath, !!isEmptyDirectory)
    menu.once("menu-will-close", () => {
        win?.webContents.send(CONTEXT_MENU_CLOSED)
    })
    menu.popup({ window: win })
})

ipcMain.handle("showBufferTreeBackgroundContextMenu", () => {
    const menu = getBufferTreeBackgroundContextMenu(win)
    menu.once("menu-will-close", () => {
        win?.webContents.send(CONTEXT_MENU_CLOSED)
    })
    menu.popup({ window: win })
})

ipcMain.handle("showSpellcheckingContextMenu", (event) => {
    // the OS spellchecking API is used on Mac, so it's not possible to select languages
    if (isMac) {
        return
    }
    getSpellcheckingContextMenu(win).popup({window: win})
})

function stopCurrentLibrarySearch() {
    if (currentLibrarySearch) {
        currentLibrarySearch.kill()
        currentLibrarySearch = null
    }
}

ipcMain.handle(LIBRARY_SEARCH_START, (event, options) => {
    stopCurrentLibrarySearch()
    if (!fileLibrary) {
        throw new Error("File library is not initialized")
    }

    let controller: any = null
    controller = startLibrarySearch(fileLibrary, options, (payload: any) => {
        if (payload.type === "match") {
            event.sender.send(LIBRARY_SEARCH_MATCH, payload)
        } else if (payload.type === "done") {
            if (currentLibrarySearch === controller) {
                currentLibrarySearch = null
            }
            event.sender.send(LIBRARY_SEARCH_DONE, payload)
        } else if (payload.type === "error") {
            if (currentLibrarySearch === controller) {
                currentLibrarySearch = null
            }
            event.sender.send(LIBRARY_SEARCH_ERROR, payload)
        }
    })
    currentLibrarySearch = controller
    return { ok: true }
})

ipcMain.handle(LIBRARY_SEARCH_CANCEL, () => {
    stopCurrentLibrarySearch()
    return { ok: true }
})

// Initialize note/file library
async function initFileLibrary(win) {
    await migrateBufferFileToLibrary(app)
    
    const customLibraryPath = CONFIG.get("settings.bufferPath")
    const defaultLibraryPath = join(app.getPath("userData"), NOTES_DIR_NAME)
    const libraryPath = customLibraryPath ? customLibraryPath : defaultLibraryPath
    //console.log("libraryPath", libraryPath)

    // if we're using the default library path, and it doesn't exist (e.g. first time run), create it
    if (!customLibraryPath && !fs.existsSync(defaultLibraryPath)) {
        fs.mkdirSync(defaultLibraryPath)
    }

    try {
        fileLibrary = new FileLibrary(libraryPath, win)
        fileLibrary.setupWatcher()
    } catch (error) {
        initErrors.push(`Error: ${error.message}`)
    }
    setCurrentFileLibrary(fileLibrary)

    // set up handlers for heynote-file:// protocol
    if (fileLibrary) {
        registerProtocol(fileLibrary)
    }
}

ipcMain.handle("getInitErrors", () => {
    return initErrors
})


ipcMain.handle('settings:set', async (event, settings) => {
    let globalHotkeyChanged = settings.enableGlobalHotkey !== CONFIG.get("settings.enableGlobalHotkey") || settings.globalHotkey !== CONFIG.get("settings.globalHotkey")
    let showInDockChanged = settings.showInDock !== CONFIG.get("settings.showInDock");
    let showInMenuChanged = settings.showInMenu !== CONFIG.get("settings.showInMenu");
    let bufferPathChanged = settings.bufferPath !== CONFIG.get("settings.bufferPath");
    let alwaysOnTopChanged = settings.alwaysOnTop !== CONFIG.get("settings.alwaysOnTop");
    let openAtLoginChanged = settings.openAtLogin !== CONFIG.get("settings.openAtLogin");
    let autoInstallUpdatesChanged = settings.autoInstallUpdates !== CONFIG.get("settings.autoInstallUpdates");
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
    if (openAtLoginChanged) {
        registerOpenAtLogin()
    }
    if (autoInstallUpdatesChanged) {
        updateAutoInstallUpdates()
    }
    if (bufferPathChanged) {
        stopCurrentLibrarySearch()
        console.log("bufferPath changed, closing existing file library")
        fileLibrary.close()
        console.log("initializing new file library")
        await initFileLibrary(win)
        win.webContents.send("library:pathChanged")
    }
})

ipcMain.handle(SAVE_TABS_STATE, async (event, tabsState) => {
    CONFIG.set("openTabsState", tabsState)
})

ipcMain.handle(LOAD_TABS_STATE, async (event) => {
    return CONFIG.get("openTabsState")
})

ipcMain.handle(GET_SYSTEM_LOCALE, async (event) => {
    return app.getSystemLocale()
})

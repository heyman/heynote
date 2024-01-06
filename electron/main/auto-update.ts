import { autoUpdater } from "electron-updater"
import { app, dialog, ipcMain } from "electron"
import CONFIG from "../config"

import { 
    UPDATE_AVAILABLE_EVENT, 
    UPDATE_NOT_AVAILABLE_EVENT, 
    UPDATE_DOWNLOADED, 
    UPDATE_DOWNLOAD_PROGRESS, 
    UPDATE_ERROR,
    UPDATE_START_DOWNLOAD,
    UPDATE_INSTALL_AND_RESTART,
    UPDATE_CHECK_FOR_UPDATES,
} from '../constants'
import { setForceQuit } from "./index";


// will reference the main window
let window

// configure logging
const log = require('electron-log');

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"

autoUpdater.autoDownload = false
autoUpdater.allowDowngrade = true

autoUpdater.on('error', (error) => {
    window?.webContents.send(UPDATE_ERROR, error == null ? "unknown" : (error.stack || error).toString())
    //dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-available', (info) => {
    window?.webContents.send(UPDATE_AVAILABLE_EVENT, {
        version: info.version,
        releaseDate: info.releaseDate,
        currentVersion: app.getVersion(),
    })
})

autoUpdater.on('update-not-available', () => {
    window?.webContents.send(UPDATE_NOT_AVAILABLE_EVENT)
})

autoUpdater.on('update-downloaded', () => {
    window?.webContents.send(UPDATE_DOWNLOADED)
})

autoUpdater.on('download-progress', (info) => {
    window?.webContents.send(UPDATE_DOWNLOAD_PROGRESS, {
        percent: info.percent,
        total: info.total,
        transferred: info.transferred,
        bytesPerSecond: info.bytesPerSecond,
    })
})

// handle messages from Vue components
ipcMain.handle(UPDATE_START_DOWNLOAD, () => {
    autoUpdater.downloadUpdate()
})

ipcMain.handle(UPDATE_INSTALL_AND_RESTART, () => {
    setImmediate(() => {
        // make sure we can quite the app if it's in the Tray/Menu bar
        setForceQuit()
        autoUpdater.quitAndInstall(true, true)
    })
})


export function checkForUpdates() {
    autoUpdater.allowPrerelease = CONFIG.get("settings.allowBetaVersions")
    autoUpdater.checkForUpdates()
    // for development, the autoUpdater will not work, so we need to trigger the event manually
    if (process.env.NODE_ENV === "development") {
        window?.webContents.send(UPDATE_NOT_AVAILABLE_EVENT)
    }
}

ipcMain.handle(UPDATE_CHECK_FOR_UPDATES, () => {
    checkForUpdates()
})

export function initializeAutoUpdate(win) {
    window = win

    /**
     * To debug auto updates (actually downloading an update won't work), 
     * uncomment the lines below, and create a dev-app-update.yml with the content:
     * 
     * owner: heyman
     * repo: heynote
     * provider: github
     */
    // Useful for some dev/debugging tasks, but download can
    // not be validated becuase dev app is not signed
    //autoUpdater.updateConfigPath = "/Users/heyman/projects/heynote/dev-app-update.yml" //path.join(__dirname, 'dev-app-update.yml');
    //autoUpdater.forceDevUpdateConfig = true;
}

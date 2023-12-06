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


// will reference the main window
let window

// configure logging
const log = require('electron-log');

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"

autoUpdater.autoDownload = false

// set channel
autoUpdater.channel = CONFIG.get("settings.releaseChannel")

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
    setImmediate(() => autoUpdater.quitAndInstall(true, true))
})


export function checkForUpdates() {
    const settingsChannel = CONFIG.get("settings.releaseChannel")
    autoUpdater.channel = (settingsChannel === null ? "latest" : settingsChannel)
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
}

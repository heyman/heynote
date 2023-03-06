import { autoUpdater } from "electron-updater"
import { app, dialog, ipcMain } from "electron"

import { 
    UPDATE_AVAILABLE_EVENT, 
    UPDATE_NOT_AVAILABLE_EVENT, 
    UPDATE_DOWNLOADED, 
    UPDATE_DOWNLOAD_PROGRESS, 
    UPDATE_ERROR,
    UPDATE_START_DOWNLOAD,
    UPDATE_INSTALL_AND_RESTART,
 } from '../constants'


// will reference the main window
let window

// configure logging
const log = require('electron-log');

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"

autoUpdater.autoDownload = false

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

export function checkForUpdates(win) {
    window = win
    
    // check for updates
    autoUpdater.checkForUpdates()
}

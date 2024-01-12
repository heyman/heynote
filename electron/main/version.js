import { app, ipcMain } from "electron"
import CONFIG from "../config"

export function getVersionString() {
    let versionString = app.getVersion()
    if (CONFIG.get("settings.allowBetaVersions")) {
        versionString += " (beta channel)"
    }
    return versionString
}

ipcMain.handle("getVersion", () => getVersionString())

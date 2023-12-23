import fs from "fs"
import { join } from "path"
import { app } from "electron"
import CONFIG from "../config"
import { isDev } from "../detect-platform"


export function getBufferFilePath() {
    let defaultPath = app.getPath("userData")
    let configPath = CONFIG.get("settings.bufferPath")
    let bufferPath = configPath.length ? configPath : defaultPath
    let bufferFilePath = join(bufferPath, isDev ? "buffer-dev.txt" : "buffer.txt")
    try {
        // use realpathSync to resolve a potential symlink
        return fs.realpathSync(bufferFilePath)
    } catch (err) {
        // realpathSync will fail if the file does not exist, but that doesn't matter since the file will be created
        if (err.code !== "ENOENT") {
            throw err
        }
        return bufferFilePath
    }
}

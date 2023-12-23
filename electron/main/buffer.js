import fs from "fs"
import { join } from "path"
import { app } from "electron"
import CONFIG from "../config"
import { isDev } from "../detect-platform"


function realpathSync(path) {
    try {
        return fs.realpathSync(path);
    } catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
    }
    return "";
};

export function getBufferFilePath() {
    let defaultPath = app.getPath("userData")
    let configPath = CONFIG.get("settings.bufferPath")
    let bufferPath = realpathSync(configPath.length ? configPath : defaultPath);
    return join(bufferPath, isDev ? "buffer-dev.txt" : "buffer.txt")
}

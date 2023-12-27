import fs from "fs"
import { join, dirname, basename } from "path"
import { app } from "electron"
import * as jetpack from "fs-jetpack";

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


export class Buffer {
    constructor({filePath, onChange}) {
        this.filePath = filePath
        this.onChange = onChange
        this.watcher = null
        this.setupWatcher()
        this._lastSavedContent = null
    }

    async load() {
        const content = await jetpack.read(this.filePath, 'utf8')
        this.setupWatcher()
        return content
    }

    async save(content) {
        this._lastSavedContent = content
        const saveResult = await jetpack.write(this.filePath, content, {
            atomic: true,
            mode: '600',
        })
        return saveResult
    }

    exists() {
        return jetpack.exists(this.filePath) === "file"
    }

    setupWatcher() {
        if (!this.watcher && this.exists()) {
            this.watcher = fs.watch(
                dirname(this.filePath), 
                {
                    persistent: true,
                    recursive: false,
                    encoding: "utf8",
                },
                async (eventType, filename) => {
                    if (filename !== basename(this.filePath)) {
                        return
                    }
                    
                    // read the file content and compare it to the last saved content
                    // (if the content is the same, then we can ignore the event)
                    const content = await jetpack.read(this.filePath, 'utf8')

                    if (this._lastSavedContent !== content) {
                        // file has changed on disk, trigger onChange
                        this.onChange({filename, eventType, content})
                    }
                }
            )
        }
    }
}

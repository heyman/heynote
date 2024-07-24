import fs from "fs"
import os from "node:os"
import { join, dirname, basename } from "path"
import { app, ipcMain, dialog } from "electron"
import * as jetpack from "fs-jetpack";

import CONFIG from "../config"
import { isDev } from "../detect-platform"
import { win } from "./index"
import { eraseInitialContent, initialContent, initialDevContent } from '../initial-content'

const untildify = (pathWithTilde) => {
    const homeDirectory = os.homedir();
    return homeDirectory
      ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory)
      : pathWithTilde;
}

export function constructBufferFilePath(directoryPath, path) {
    return join(untildify(directoryPath), path)
}

export function getFullBufferFilePath(path) {
    let defaultPath = app.getPath("userData")
    let configPath = CONFIG.get("settings.bufferPath")
    let bufferPath = configPath.length ? configPath : defaultPath
    let bufferFilePath = constructBufferFilePath(bufferPath, path)
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
                        this.onChange(content)
                    }
                }
            )
        }
    }

    close() {
        if (this.watcher) {
            this.watcher.close()
            this.watcher = null
        }
    }
}


// Buffer
let buffers = {}
export function loadBuffer(path) {
    if (buffers[path]) {
        buffers[path].close()
    }
    buffers[path] = new Buffer({
        filePath: getFullBufferFilePath(path),
        onChange: (content) => {
            console.log("Old buffer.js onChange")
            win?.webContents.send("buffer-content:change", path, content)
        },
    })
    return buffers[path]
}

ipcMain.handle('buffer-content:load', async (event, path) => {
    if (!buffers[path]) {
        loadBuffer(path)
    }
    if (buffers[path].exists() && !(eraseInitialContent && isDev)) {
        return await buffers[path].load()
    } else {
        return isDev ? initialDevContent : initialContent
    }
});

async function save(path, content) {
    return await buffers[path].save(content)
}

ipcMain.handle('buffer-content:save', async (event, path, content) => {
    return await save(path, content)
});

export let contentSaved = false
ipcMain.handle('buffer-content:saveAndQuit', async (event, contents) => {
    for (const [path, content] of contents) {
        await save(path, content)
    }
    contentSaved = true
    app.quit()
})

ipcMain.handle("buffer-content:selectLocation", async () => {
    let result = await dialog.showOpenDialog({
        title: "Select directory to store buffer",
        properties: [
            "openDirectory",
            "createDirectory",
            "noResolveAliases",
        ],
    })
    if (result.canceled) {
        return
    }
    const filePath = result.filePaths[0]
    if (fs.existsSync(constructBufferFilePath(filePath))) {
        if (dialog.showMessageBoxSync({
            type: "question",
            message: "The selected directory already contains a buffer file. It will be loaded. Do you want to continue?",
            buttons: ["Cancel", "Continue"],
        }) === 0) {
            return
        }
    }
    return filePath
})

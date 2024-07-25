import fs from "fs"
import os from "node:os"
import { join, dirname, basename } from "path"

import * as jetpack from "fs-jetpack";
import { app, ipcMain, dialog } from "electron"


const untildify = (pathWithTilde) => {
    const homeDir = os.homedir()
    return homeDir ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDir) : pathWithTilde
}

async function readNoteMetadata(filePath) {
    const chunks = []
    for await (let chunk of fs.createReadStream(filePath, { start: 0, end:4000 })) {
        chunks.push(chunk)
    }
    const headContent = Buffer.concat(chunks).toString("utf8")
    const firstSeparator = headContent.indexOf("\n∞∞∞")
    if (firstSeparator === -1) {
        return null
    }
    try {
        const metadata = JSON.parse(headContent.slice(0, firstSeparator).trim())
        return {"name": metadata.name, "tags": metadata.tags}
    } catch (e) {
        return {}
    }
}


export class FileLibrary {
    constructor(basePath) {
        basePath = untildify(basePath)
        if (jetpack.exists(basePath) !== "dir") {
            throw new Error(`Path directory does not exist: ${basePath}`)
        }
        this.basePath = fs.realpathSync(basePath)
        this.jetpack = jetpack.cwd(this.basePath)
        this.files = {};
        this.watcher = null;
        this.contentSaved = false
        this.onChangeCallback = null
    }

    async exists(path) {
        return this.jetpack.exists(path) === "file"
    }

    async load(path) {
        if (this.files[path]) {
            return this.files[path].read()
        }
        const fullPath = fs.realpathSync(join(this.basePath, path))
        this.files[path] = new NoteBuffer({fullPath, library:this})
        return await this.files[path].read()
    }

    async save(path, content) {
        if (!this.files[path]) {
            throw new Error(`File not loaded: ${path}`)
        }
        return await this.files[path].save(content)
    }

    async getList() {
        console.log("Loading notes")
        const notes = {}
        const files = await this.jetpack.findAsync(".", {
            matching: "*.txt",
            recursive: true,
        })
        const promises = []
        for (const file of files) {
            promises.push(readNoteMetadata(join(this.basePath, file)))
        }
        const metadataList = await Promise.all(promises)
        metadataList.forEach((metadata, i) => {
            const path = files[i]
            notes[path] = metadata
        })
        return notes
    }

    async getDirectoryList() {
         const directories = await this.jetpack.findAsync("", {
            files: false,
            directories: true,
            recursive: true,
         })
         return directories
    }

    setupWatcher(win) {
        if (!this.watcher) {
            this.watcher = fs.watch(
                this.basePath, 
                {
                    persistent: true,
                    recursive: true,
                    encoding: "utf8",
                },
                async (eventType, changedPath) => {
                    console.log("File changed", eventType, changedPath)
                    //if (changedPath.toLowerCase().endsWith(".txt")) {
                    //    console.log("txt", this.notes)
                    //    if (await this.exists(changedPath)) {
                    //        console.log("file exists!")
                    //        const newMetadata = await readNoteMetadata(join(this.basePath, changedPath))
                    //        if (!(changedPath in this.notes) || newMetadata.name !== this.notes[changedPath].name) {
                    //            this.notes[changedPath] = newMetadata
                    //            win.webContents.send("buffer:noteMetadataChanged", changedPath, newMetadata)
                    //            console.log("metadata changed")
                    //        } else {
                    //            console.log("no metadata change")
                    //        }
                    //    } else if (changedPath in this.notes) {
                    //        console.log("note removed", changedPath)
                    //        delete this.notes[changedPath]
                    //        win.webContents.send("buffer:noteRemoved", changedPath)
                    //    }
                    //}
                    for (const [path, buffer] of Object.entries(this.files)) {
                        if (changedPath === basename(path)) {
                            const content = await buffer.read()
                            if (buffer._lastSavedContent !== content) {
                                win.webContents.send("buffer:change", path, content)
                            }
                        }
                    }
                }
            )
        }
    }

    closeFile(path) {
        if (this.files[path]) {
            delete this.files[path]
        }
    }

    close() {
        for (const buffer of Object.values(this.files)) {
            this.closeFile(buffer.filePath)
        }
        this.stopWatcher()
    }

    stopWatcher() {
        if (this.watcher) {
            this.watcher.close()
            this.watcher = null
        }
    }
}



export class NoteBuffer {
    constructor({fullPath, library}) {
        this.fullPath = fullPath
        this._lastSavedContent = null
        this.library = library
    }

    async read() {
        return await this.library.jetpack.read(this.fullPath, 'utf8')
    }

    async save(content) {
        this._lastSavedContent = content
        const saveResult = await this.library.jetpack.write(this.fullPath, content, {
            atomic: true,
            mode: '600',
        })
        return saveResult
    }

    exists() {
        return jetpack.exists(this.fullPath) === "file"
    }
}


export function setupFileLibraryEventHandlers(library, win) {
    ipcMain.handle('buffer:load', async (event, path) => {
        console.log("buffer:load", path)
        return await library.load(path)
    });


    ipcMain.handle('buffer:save', async (event, path, content) => {
        return await library.save(path, content)
    });

    ipcMain.handle('buffer:getList', async (event) => {
        return await library.getList()
    });

    ipcMain.handle('buffer:getDirectoryList', async (event) => {
        return await library.getDirectoryList()
    });

    ipcMain.handle('buffer:exists', async (event, path) => {
        return await library.exists(path)
    });

    ipcMain.handle('buffer:close', async (event, path) => {
        return await library.closeFile(path)
    });

    ipcMain.handle('buffer:saveAndQuit', async (event, contents) => {
        library.stopWatcher()
        for (const [path, content] of contents) {
            await library.save(path, content)
        }
        library.contentSaved = true
        app.quit()
    })

    library.setupWatcher(win)
}

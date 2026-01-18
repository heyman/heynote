import fs from "fs"
import os from "node:os"
import { join, basename } from "path"

import * as jetpack from "fs-jetpack";
import { app, ipcMain, dialog } from "electron"
import * as mimetypes from "mime-types"

import CONFIG from "../config"
import { SCRATCH_FILE_NAME, IMAGE_MIME_TYPES } from "../../src/common/constants"
import { NoteFormat } from "../../src/common/note-format"
import { isDev } from '../detect-platform';
import { initialContent, initialDevContent } from '../initial-content'
import { getImgReferences } from "./ripgrep.js"

export const NOTES_DIR_NAME = isDev ? "notes-dev" : "notes"


/**@type {FileLibrary}*/
let library

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
    constructor(basePath, win) {
        this.win = win
        basePath = untildify(basePath)
        if (jetpack.exists(basePath) !== "dir") {
            throw new Error(`Path directory does not exist: ${basePath}`)
        }
        this.basePath = fs.realpathSync(basePath)
        this.imagesBasePath = join(this.basePath, ".images")
        this.jetpack = jetpack.cwd(this.basePath)
        this.files = {};
        this.watcher = null;
        this.contentSaved = false
        this.onChangeCallback = null
        this._onWindowFocus = null

        // create scratch.txt if it doesn't exist
        if (!this.jetpack.exists(SCRATCH_FILE_NAME)) {
            this.jetpack.write(SCRATCH_FILE_NAME, isDev ? initialDevContent : initialContent)
        }

        // garbage collect stale images
        this.removeUnreferencedImages()
    }

    async exists(path) {
        return this.jetpack.exists(path) === "file"
    }

    async load(path) {
        if (this.files[path]) {
            return this.files[path].load()
        }
        const fullPath = fs.realpathSync(join(this.basePath, path))
        this.files[path] = new NoteBuffer({fullPath, library:this})
        return await this.files[path].load()
    }

    async save(path, content) {
        if (!this.files[path]) {
            throw new Error(`File not loaded: ${path}`)
        }
        return await this.files[path].save(content)
    }

    async create(path, content) {
        if (await this.exists(path)) {
            throw new Error(`File already exists: ${path}`)
        }
        const fullPath = join(this.basePath, path)
        await this.jetpack.writeAsync(fullPath, content)
    }

    async move(path, newPath) {
        if (await this.exists(newPath)) {
            throw new Error(`File already exists: ${newPath}`)
        }
        const fullOldPath = join(this.basePath, path)
        const fullNewPath = join(this.basePath, newPath)
        await this.jetpack.moveAsync(fullOldPath, fullNewPath)
    }

    async delete(path) {
        if (path === SCRATCH_FILE_NAME) {
            throw new Error("Can't delete scratch file")
        }
        const fullPath = join(this.basePath, path)
        await this.jetpack.removeAsync(fullPath)
    }

    async getList() {
        //console.log("Listing notes")
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

    /**
     * @returns {Array<string>} List of path to all directories, but not the root directory.
     */
    async getDirectoryList() {
         const directories = await this.jetpack.findAsync("", {
            files: false,
            directories: true,
            recursive: true,
         })
         return directories
    }

    setupWatcher() {
        if (!this.watcher) {
            this.watcher = fs.watch(
                this.basePath, 
                {
                    persistent: true,
                    recursive: true,
                    encoding: "utf8",
                },
                async (eventType, changedPath) => {
                    //console.log("File changed", eventType, changedPath)
                    for (const [path, buffer] of Object.entries(this.files)) {
                        if (changedPath === basename(path)) {
                            const content = await buffer.loadIfChanged()
                            if (content !== null) {
                                this.win.webContents.send("buffer:change", path, content)
                            }
                        }
                    }
                }
            )
            
            // fs.watch() is unreliable in some cases, e.g. OneDrive on Windows. Therefor we'll load the open buffer files 
            // and check for changes when the window gets focus.
            this._onWindowFocus = async (event) => {
                for (const [path, buffer] of Object.entries(this.files)) {
                    const content = await buffer.loadIfChanged()
                    if (content !== null) {
                        this.win.webContents.send("buffer:change", path, content)
                    }
                }
            }
            this.win.on("focus", this._onWindowFocus)
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
        if (this._onWindowFocus) {
            this.win.off("focus", this._onWindowFocus)
            this._onWindowFocus = null
        }
    }

    async saveImage({mime, data}) {
        console.log("mime:", mime)
        if (!IMAGE_MIME_TYPES.includes(mime)) {
            return
        }
        const fileExtension = mimetypes.extension(mime)
        const filename = (new Date()).toISOString() + "." + fileExtension

        const u8 = data instanceof Uint8Array ? data : new Uint8Array(data)
        const buf = Buffer.from(u8)
        //console.log("saveImage", filename, mime, buf.length)
        await this.jetpack.writeAsync(join(this.imagesBasePath, filename), buf)
        return filename
    }

    removeImage() {
        
    }

    listImages() {

    }

    async removeUnreferencedImages() {
        if (!jetpack.exists(this.imagesBasePath)) {
            console.log(`${this.imagesBasePath} does not exist, so no cleanup needed`)
            return
        }

        let referencedImages = []
        try {
            referencedImages = await getImgReferences(this.basePath)
        } catch (err) {
            console.error(err)
        }
        
        const jp = jetpack.cwd(this.imagesBasePath)
        const files = await jp.findAsync("", {
            matching: "*",
            recursive: false,
        })
        let referencedImageFound = false
        const filesToDelete = []
        for (const filename of files) {
            if (referencedImages.includes(filename)) {
                //console.log("File is referenced, skipping:", filename)
                referencedImageFound = true
                continue
            }
            const fileInfo = await jp.inspectAsync(filename, {times: true})
            if (!fileInfo || !fileInfo.modifyTime) {
                continue
            }
            if ((new Date() - fileInfo.modifyTime) > 1000 * 3600 * 24) {
                //console.log("deleting file:", filename)
                filesToDelete.push(filename)
            }
        }

        if (!referencedImageFound) {
            console.log(`No referenced images found, so as a precaution, we won't do any removal of unreferenced images`)
            return
        }

        for (const filename of filesToDelete) {
            await jp.removeAsync(filename)
        }   
        console.log(`Removed ${filesToDelete.length} unreferenced image files`)
    }
}


export class NoteBuffer {
    constructor({fullPath, library}) {
        this.fullPath = fullPath
        this._lastKnownContent = null
        this.library = library
    }

    async read() {
        return await this.library.jetpack.read(this.fullPath, 'utf8')
    }

    /**
     * load() assumes that the actual note buffer is actually updated with the new content, otherwise 
     * _lastKnownContent will be out of sync. If you just want to read the content, use read() instead.
     */
    async load() {
        const content = await this.read()
        this._lastKnownContent = content
        return content
    }

    /**
     * loadIfChanged() will only return the content if it has changed since the last time it was loaded.
     * If content is returned, the note buffer must be updated with the new content in order to keep the
     * _lastKnownContent in sync.
     */
    async loadIfChanged() {
        const content = await this.read()
        // if the file was removed (e.g. during an atomic save) the content will be undefined
        if (content !== undefined && this._lastKnownContent !== content) {
            this._lastKnownContent = content
            return content
        }
        return null
    }

    async save(content) {
        this._lastKnownContent = content
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

export function setCurrentFileLibrary(lib) {
    library = lib
}

export function setupFileLibraryEventHandlers() {
    ipcMain.handle('buffer:load', async (event, path) => {
        //console.log("buffer:load", path)
        return await library.load(path)
    });


    ipcMain.handle('buffer:save', async (event, path, content) => {
        return await library.save(path, content)
    });

    ipcMain.handle('buffer:create', async (event, path, content) => {
        return await library.create(path, content)
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

    ipcMain.handle('buffer:move', async (event, path, newPath) => {
        return await library.move(path, newPath)
    });

    ipcMain.handle('buffer:delete', async (event, path) => {
        return await library.delete(path)
    });

    ipcMain.handle("library:selectLocation", async () => {
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
        return filePath
    })

    ipcMain.handle("library:saveImage", async (event, blob) => {
        return await library.saveImage(blob)
    })
}


export async function migrateBufferFileToLibrary(app) {
    async function ensureBufferFileMetadata(filePath) {
        const metadata = await readNoteMetadata(filePath)
        //console.log("Metadata", metadata)
        if (!metadata || !metadata.name) {
            console.log("Adding metadata to", filePath)
            const note = NoteFormat.load(jetpack.read(filePath))
            note.metadata.name = "Scratch"
            jetpack.write(filePath, note.serialize())
        } else {
            console.log("Metadata already exists for", filePath)
        }
    }

    function getBackupFile(filePath) {
        // Get a backup file path by adding a .bak suffix. If the file already exists, add a number suffix.
        let backupFile = filePath + ".bak";
        for (let i = 1; i < 1000; i++) {
            if (jetpack.exists(backupFile) !== "file") {
                return backupFile;
            }
            backupFile = `${filePath}.bak.${i}`;
        }
        throw new Error(`Unable to find an available file path after 1000 attempts for base path: ${filePath}`);
    }

    const defaultLibraryPath = join(app.getPath("userData"), NOTES_DIR_NAME)
    const customBufferPath = CONFIG.get("settings.bufferPath")
    const oldBufferFile = isDev ? "buffer-dev.txt" : "buffer.txt"
    if (customBufferPath) {
        // if the new buffer file exists, no need to migrate
        if (jetpack.exists(join(customBufferPath, SCRATCH_FILE_NAME)) === "file") {
            return
        }
        const oldBufferFileFullPath = join(customBufferPath, oldBufferFile)
        const backupFile = getBackupFile(oldBufferFileFullPath)
        if (jetpack.exists(oldBufferFileFullPath) === "file") {
            // make a backup copy of the old buffer file
            console.log(`Taking backup of ${oldBufferFileFullPath} to ${backupFile}`)
            jetpack.copy(oldBufferFileFullPath, backupFile)

            // rename buffer file to scratch.txt
            const newFileFullPath = join(customBufferPath, SCRATCH_FILE_NAME);
            console.log(`Migrating file ${oldBufferFileFullPath} to ${newFileFullPath}`)
            jetpack.move(oldBufferFileFullPath, newFileFullPath)
            // add metadata to scratch.txt (just to be sure, we'll double check that it's needed first)
            await ensureBufferFileMetadata(newFileFullPath)
        }  
    } else {
        // if the new buffer file exists, no need to migrate
        if (jetpack.exists(join(defaultLibraryPath, SCRATCH_FILE_NAME)) === "file") {
            return
        }
        // check if the old buffer file exists, while the default *library* path doesn't exist
        const oldBufferFileFullPath = join(app.getPath("userData"), oldBufferFile)
        const backupFile = getBackupFile(oldBufferFileFullPath)
        if (jetpack.exists(oldBufferFileFullPath) === "file" && jetpack.exists(defaultLibraryPath) !== "dir") {
            // make a backup copy of the old buffer file
            console.log(`Taking backup of ${oldBufferFileFullPath} to ${backupFile}`)
            jetpack.copy(oldBufferFileFullPath, backupFile)

            const newFileFullPath = join(defaultLibraryPath, SCRATCH_FILE_NAME);
            console.log(`Migrating buffer file ${oldBufferFileFullPath} to ${newFileFullPath}`)
            // create the default library path
            jetpack.dir(defaultLibraryPath)
            // move the buffer file to the library path
            jetpack.move(oldBufferFileFullPath, newFileFullPath)
            // add metadata to scratch.txt
            await ensureBufferFileMetadata(newFileFullPath)
        }
    }
}

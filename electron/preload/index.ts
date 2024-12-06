const { contextBridge } = require('electron')
import themeMode from "./theme-mode"
import { isMac, isWindows, isLinux, isDev } from "../detect-platform"
import { ipcRenderer } from "electron"
import { 
    WINDOW_CLOSE_EVENT, 
    OPEN_SETTINGS_EVENT, 
    SETTINGS_CHANGE_EVENT, 
    UPDATE_AVAILABLE_EVENT, 
    UPDATE_ERROR, 
    UPDATE_DOWNLOAD_PROGRESS, 
    UPDATE_NOT_AVAILABLE_EVENT,
    UPDATE_START_DOWNLOAD,
    UPDATE_INSTALL_AND_RESTART,
    UPDATE_DOWNLOADED,
    UPDATE_CHECK_FOR_UPDATES,
} from "../constants"
import CONFIG from "../config"
import getCurrencyData from "./currency"


contextBridge.exposeInMainWorld("heynote", {
    defaultFontFamily: "Hack", 
    defaultFontSize: 12,

    platform: {
        isMac,
        isWindows,
        isLinux,
        isWebApp: false,
    },
    
    isDev: isDev,
    themeMode: themeMode,

    init() {
        ipcRenderer.on("buffer:change", (event, path, content) => {
            // called on all changes to open buffer files
            // go through all registered callbacks for this path and call them
            if (this.buffer._onChangeCallbacks[path]) {
                this.buffer._onChangeCallbacks[path].forEach(callback => callback(content))
            }
        })
    },

    quit() {
        console.log("quitting")
        //ipcRenderer.invoke("app_quit")
    },

    onWindowClose(callback) {
        ipcRenderer.on(WINDOW_CLOSE_EVENT, callback)
    },

    onOpenSettings(callback) {
        ipcRenderer.on(OPEN_SETTINGS_EVENT, callback)
    },

    buffer: {
        async exists(path) {
            return await ipcRenderer.invoke("buffer:exists", path)
        },

        async getList() {
            return await ipcRenderer.invoke("buffer:getList")
        },

        async getDirectoryList() {
            return await ipcRenderer.invoke("buffer:getDirectoryList")
        },

        async load(path) {
            return await ipcRenderer.invoke("buffer:load", path)
        },

        async save(path, content) {
            return await ipcRenderer.invoke("buffer:save", path, content)
        },

        async delete(path) {
            return await ipcRenderer.invoke("buffer:delete", path)
        },

        async move(path, newPath) {
            return await ipcRenderer.invoke("buffer:move", path, newPath)
        },

        async create(path, content) {
            return await ipcRenderer.invoke("buffer:create", path, content)
        },

        async saveAndQuit(contents) {
            return await ipcRenderer.invoke("buffer:saveAndQuit", contents)
        },

        async close(path) {
            return await ipcRenderer.invoke("buffer:close", path)
        },

        _onChangeCallbacks: {},
        addOnChangeCallback(path, callback) {
            // register a callback to be called when the buffer content changes for a specific file
            if (!this._onChangeCallbacks[path]) {
                this._onChangeCallbacks[path] = []
            }
            this._onChangeCallbacks[path].push(callback)
        },
        removeOnChangeCallback(path, callback) {
            if (this._onChangeCallbacks[path]) {
                this._onChangeCallbacks[path] = this._onChangeCallbacks[path].filter(cb => cb !== callback)
            }
        },

        async selectLocation() {
            return await ipcRenderer.invoke("library:selectLocation")
        },

        setLibraryPathChangeCallback(callback) {
            ipcRenderer.on("library:pathChanged", callback)
        },
    },

    settings: CONFIG.get("settings"),
    
    setSettings(settings) {
        ipcRenderer.invoke("settings:set", settings)
    },

    async getCurrencyData() {
        return await getCurrencyData()
    },

    onSettingsChange(callback) {
        ipcRenderer.on(SETTINGS_CHANGE_EVENT, (event, settings) => callback(settings))
    },

    autoUpdate: {
        callbacks(callbacks) {
            ipcRenderer.on(UPDATE_AVAILABLE_EVENT, (event, info) => callbacks?.updateAvailable(info))
            ipcRenderer.on(UPDATE_NOT_AVAILABLE_EVENT, (event) => callbacks?.updateNotAvailable())
            ipcRenderer.on(UPDATE_DOWNLOADED, (event) => callbacks?.updateDownloaded())
            ipcRenderer.on(UPDATE_ERROR, (event, error) => callbacks?.updateError(error))
            ipcRenderer.on(UPDATE_DOWNLOAD_PROGRESS, (event, progress) => callbacks?.updateDownloadProgress(progress))
        },

        startDownload() {
            ipcRenderer.invoke(UPDATE_START_DOWNLOAD)
        },
        installAndRestart() {
            ipcRenderer.invoke(UPDATE_INSTALL_AND_RESTART)
        },
        checkForUpdates() {
            ipcRenderer.invoke(UPDATE_CHECK_FOR_UPDATES)
        },
    },

    async getVersion() {
        return await ipcRenderer.invoke("getVersion")
    },

    async getInitErrors() {
        return await ipcRenderer.invoke("getInitErrors")
    },

    setWindowTitle(title) {
        ipcRenderer.invoke("setWindowTitle", title)
    },
})


function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
    return new Promise((resolve) => {
        if (condition.includes(document.readyState)) {
            resolve(true)
        } else {
            document.addEventListener('readystatechange', () => {
                if (condition.includes(document.readyState)) {
                    resolve(true)
                }
            })
        }
    })
}

const safeDOM = {
    append(parent: HTMLElement, child: HTMLElement) {
        if (!Array.from(parent.children).find(e => e === child)) {
            return parent.appendChild(child)
        }
    },
    remove(parent: HTMLElement, child: HTMLElement) {
        if (Array.from(parent.children).find(e => e === child)) {
            return parent.removeChild(child)
        }
    },
}


function useLoading() {
    const className = `loaders-css__square-spin`
    const styleContent = `
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  z-index: 9;
}
@media (prefers-color-scheme: dark) {
    .${className} > div {
        background: #fff;
    }
    .app-loading-wrap {
        background: #262B37
    }
}
    `
    const oStyle = document.createElement('style')
    const oDiv = document.createElement('div')

    oStyle.id = 'app-loading-style'
    oStyle.innerHTML = styleContent
    oDiv.className = 'app-loading-wrap'
    oDiv.innerHTML = `<div class="${className}"></div>`

    return {
        appendLoading() {
            safeDOM.append(document.head, oStyle)
            safeDOM.append(document.body, oDiv)
        },
        removeLoading() {
            safeDOM.remove(document.head, oStyle)
            safeDOM.remove(document.body, oDiv)
        },
    }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
    ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

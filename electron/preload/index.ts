const { contextBridge } = require('electron')
import themeMode from "./theme-mode"
import { isMac, isWindows, isLinux } from "../detect-platform"
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

    themeMode: themeMode,

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
        async load() {
            return await ipcRenderer.invoke("buffer-content:load")
        },

        async save(content) {
            return await ipcRenderer.invoke("buffer-content:save", content)
        },

        async saveAndQuit(content) {
            return await ipcRenderer.invoke("buffer-content:saveAndQuit", content)
        },

        onChangeCallback(callback) {
            ipcRenderer.on("buffer-content:change", callback)
        },

        async selectLocation() {
            return await ipcRenderer.invoke("buffer-content:selectLocation")
        }
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

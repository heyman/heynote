import { SETTINGS_CHANGE_EVENT, OPEN_SETTINGS_EVENT } from "../electron/constants";

const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)')
let themeCallback = null
mediaMatch.addEventListener("change", async (event) => {
    if (themeCallback) {
        themeCallback((await Heynote.themeMode.get()).computed)
    }
})

const isMobileDevice = window.matchMedia("(max-width: 600px)").matches

let autoUpdateCallbacks = null
let currencyData = null

let platform
const uaPlatform = window.navigator?.userAgentData?.platform || window.navigator.platform
if (uaPlatform.indexOf("Win") !== -1) {
    platform = {
        isMac: false,
        isWindows: true,
        isLinux: false,
    }
}  else if (uaPlatform.indexOf("Linux") !== -1) {
    platform = {
        isMac: false,
        isWindows: false,
        isLinux: true,
    }
} else {
    platform = {
        isMac: true,
        isWindows: false,
        isLinux: false,
    }
}
platform.isWebApp = true


class IpcRenderer {
    constructor() {
        this.callbacks = {}
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = []
        }
        this.callbacks[event].push(callback)
    }

    send(event, ...args) {
        if (this.callbacks[event]) {
            for (const callback of this.callbacks[event]) {
                callback(null, ...args)
            }
        }
    }
}

const ipcRenderer = new IpcRenderer()

// get initial settings
let settingsData = localStorage.getItem("settings")
let initialSettings = {
    keymap: "default",
    emacsMetaKey: "alt",
    showLineNumberGutter: true,
    showFoldGutter: true,
    bracketClosing: false,
}
if (settingsData !== null) {
    initialSettings = Object.assign(initialSettings, JSON.parse(settingsData))
}


const Heynote = {
    platform: platform,
    defaultFontFamily: "Hack", 
    defaultFontSize: isMobileDevice ? 16 : 12,

    buffer: {
        async load() {
            const content = localStorage.getItem("buffer")
            return content === null ? "\n∞∞∞text-a\n" : content
        },

        async save(content) {
            localStorage.setItem("buffer", content)
        },

        async saveAndQuit(content) {
            
        },

        onChangeCallback(callback) {
            
        },
    },

    onWindowClose(callback) {
        //ipcRenderer.on(WINDOW_CLOSE_EVENT, callback)
    },

    settings: initialSettings,

    onOpenSettings(callback) {
        ipcRenderer.on(OPEN_SETTINGS_EVENT, callback)
    },

    onSettingsChange(callback) {
        ipcRenderer.on(SETTINGS_CHANGE_EVENT, (event, settings) => callback(settings))
    },

    setSettings(settings) {
        localStorage.setItem("settings", JSON.stringify(settings))
        ipcRenderer.send(SETTINGS_CHANGE_EVENT, settings)
    },

    themeMode: {
        set: (mode) => {
            localStorage.setItem("theme", mode)
            themeCallback(mode)
            console.log("set theme to", mode)
        },
        get: async () => {
            const theme = localStorage.getItem("theme") || "system"
            const systemTheme = mediaMatch.matches ? "dark" : "light"
            return {
                theme: theme,
                computed: theme === "system" ? systemTheme : theme,
            }
        },
        onChange: (callback) => {
            themeCallback = callback
        },
        removeListener() {
            themeCallback = null
        },
        initial: localStorage.getItem("theme") || "system",
    },

    getCurrencyData: async () => {
        if (currencyData !== null) {
            return currencyData
        }
        const response = await fetch("https://currencies.heynote.com/rates.json", {cache: "no-cache"})
        currencyData = JSON.parse(await response.text())
        return currencyData
    },

    async getVersion() {
        return __APP_VERSION__ + " (" + __GIT_HASH__ + ")"
    },

    async getInitErrors() {
        
    },
}

export { Heynote, ipcRenderer}

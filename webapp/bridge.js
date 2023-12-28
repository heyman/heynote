const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)')
let themeCallback = null
mediaMatch.addEventListener("change", async (event) => {
    if (themeCallback) {
        themeCallback((await Heynote.themeMode.get()).computed)
    }
})

let autoUpdateCallbacks = null
let currencyData = null

const Heynote = {
    platform: {
        isMac: true,
        isWindows: false,
        isLinux: false,
    },

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
    },

    onWindowClose(callback) {
        //ipcRenderer.on(WINDOW_CLOSE_EVENT, callback)
    },

    onOpenSettings(callback) {
        //ipcRenderer.on(OPEN_SETTINGS_EVENT, callback)
    },

    onSettingsChange(callback) {
        //ipcRenderer.on(SETTINGS_CHANGE_EVENT, (event, settings) => callback(settings))
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

    settings: {
        keymap: "default",
    },

    getCurrencyData: async () => {
        if (currencyData !== null) {
            return currencyData
        }
        const response = await fetch("https://currencies.heynote.com/rates.json", {cache: "no-cache"})
        currencyData = JSON.parse(await response.text())
        return currencyData
    },
}

export default Heynote

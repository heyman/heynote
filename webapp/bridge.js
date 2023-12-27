const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)')
let themeModeChangeListener = null
let autoUpdateCallbacks = null
let themeCallback = null

let currencyData = null

export default {
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

        onChangeCallback(callback) {
            
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
            themeCallback(mode)
            document.body.setAttribute("theme", mode === "dark" ? "dark" : "light")
        },
        get: async () => {
            return {
                theme: "light",
                computed: "light",
            }
        },
        onChange: (callback) => {
            themeCallback = callback
            themeModeChangeListener = (event) => {
                callback(event.matches ? "dark" : "light")
            }
            mediaMatch.addEventListener('change', themeModeChangeListener)
            return mediaMatch
        },
        removeListener() {
            mediaMatch.removeEventListener('change', themeModeChangeListener)
        },
        initial: "light",
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

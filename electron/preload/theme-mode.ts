const { ipcRenderer } = require('electron')

const getComputedTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light"
const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)')
let darkModeChangeListener = null

export default {
    set: (mode) => ipcRenderer.invoke('dark-mode:set', mode),
    get: async () => {
        const mode = await ipcRenderer.invoke('dark-mode:get')
        return {
            theme: mode,
            computed: getComputedTheme(),
        }
    },
    onChange: (callback) => {
        darkModeChangeListener = (event) => {
            callback(event.matches ? "dark" : "light")
        }
        mediaMatch.addEventListener('change', darkModeChangeListener)
        return mediaMatch
    },
    removeListener() {
        mediaMatch.removeEventListener('change', darkModeChangeListener)
    },
    initial: getComputedTheme(),
}

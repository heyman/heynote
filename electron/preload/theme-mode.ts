const { ipcRenderer } = require('electron')

const getComputedTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light"
const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)')
let themeModeChangeListener = null

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
        themeModeChangeListener = (event) => {
            callback(event.matches ? "dark" : "light")
        }
        mediaMatch.addEventListener('change', themeModeChangeListener)
        return mediaMatch
    },
    removeListener() {
        mediaMatch.removeEventListener('change', themeModeChangeListener)
    },
    initial: getComputedTheme(),
}

import {
    SETTINGS_CHANGE_EVENT,
    OPEN_SETTINGS_EVENT,
    SAVE_TABS_STATE,
    LOAD_TABS_STATE,
    WINDOW_CLOSE_EVENT,
    DEFAULT_LEFT_PANEL_WIDTH,
    LIBRARY_SEARCH_CANCEL,
    LIBRARY_SEARCH_DONE,
    LIBRARY_SEARCH_ERROR,
    LIBRARY_SEARCH_MATCH,
    LIBRARY_SEARCH_START,
} from "@/src/common/constants";
import { generateClientId, TEST_CLIENT_ID } from "@/src/common/client-id";
import { CURRENCY_RATES_URL, getCurrencyFetchOptions } from "@/src/common/currency-request";
import { normalizeLibrarySearchMatch } from "@/src/common/library-search-match";
import { isLibrarySearchQueryLongEnough } from "@/src/common/library-search-query.js";
import { NoteFormat } from "../src/common/note-format";

const NOTE_KEY_PREFIX = "heynote-library__"
const DIRECTORY_LIST_KEY = "heynote-library-directories"
const CLIENT_ID_KEY = "clientId"

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

// In the latest version of Playwright, the window.navigator.userAgentData.platform is not reported correctly on Mac,
// wo we'll fallback to deprecated window.navigator.platform which still works
if (__TESTS__ && window.navigator.platform.indexOf("Mac") !== -1) {
    platform = {
        isMac: true,
        isWindows: false,
        isLinux: false,
    }
} else {
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
}
platform.isWebApp = true

function getClientId() {
    if (__TESTS__) {
        localStorage.setItem(CLIENT_ID_KEY, TEST_CLIENT_ID)
        return TEST_CLIENT_ID
    }

    let clientId = localStorage.getItem(CLIENT_ID_KEY)
    if (!clientId) {
        clientId = generateClientId()
        localStorage.setItem(CLIENT_ID_KEY, clientId)
    }
    return clientId
}


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

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback)
        }
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
    bufferTreeOpenFolders: [],
    bracketClosing: false,
    keyBindings: [],
    showTabs: true,
    showTabsInFullscreen: true,
    leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
    startHidden: false,
    colorPreviewEnabled: true,
    cursorBlinkRate: 1000,
    librarySearchSettings: {
        caseSensitive: false,
        wholeWord: false,
        regexp: false,
    },
}
if (settingsData !== null) {
    initialSettings = Object.assign(initialSettings, JSON.parse(settingsData))
}

function noteKey(path) {
    return NOTE_KEY_PREFIX + path
}

function getStoredDirectories() {
    try {
        return JSON.parse(localStorage.getItem(DIRECTORY_LIST_KEY) || "[]")
    } catch {
        return []
    }
}

function setStoredDirectories(directories) {
    localStorage.setItem(DIRECTORY_LIST_KEY, JSON.stringify([...new Set(directories)].sort()))
}

function getDirectoriesFromNotes() {
    const directories = new Set()
    for (let key in localStorage) {
        if (key.startsWith(NOTE_KEY_PREFIX)) {
            const path = key.slice(NOTE_KEY_PREFIX.length)
            const parts = path.split("/")
            if (parts.length > 1) {
                for (let i = 1; i < parts.length; i++) {
                    directories.add(parts.slice(0, i).join("/"))
                }
            }
        }
    }
    return [...directories]
}

function getNoteMetadata(content) {
    const firstSeparator = content.indexOf("\n∞∞∞")
    if (firstSeparator === -1) {
        return null
    }
    try {
        const metadata = JSON.parse(content.slice(0, firstSeparator).trim())
        return {"name": metadata.name}
    } catch (e) {
        return {}
    }
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function createLibrarySearchPattern(options, flags) {
    const query = options?.query || ""
    if (options.regexp) {
        return new RegExp(query, flags)
    }
    if (options.wholeWord) {
        return new RegExp(`\\b${escapeRegExp(query)}\\b`, flags)
    }
    return new RegExp(escapeRegExp(query), flags)
}

// Migrate single buffer (Heynote pre 2.0) in localStorage to notes library
// At some point we can remove this migration code
function migrateBufferFileToLibrary() {
    if (!("buffer" in localStorage)) {
        // nothing to migrate
        return
    }
    if (Object.keys(localStorage).filter(key => key.startsWith(NOTE_KEY_PREFIX)).length > 0) {
        // already migrated
        return
    }

    console.log("Migrating single buffer to notes library")

    let content = localStorage.getItem("buffer")
    const metadata = getNoteMetadata(content)
    if (!metadata || !metadata.name) {
        console.log("Adding metadata to Scratch note")
        const note = NoteFormat.load(content)
        note.metadata.name = "Scratch"
        content = note.serialize()
    }
    localStorage.setItem("heynote-library__scratch.txt", content)
    localStorage.removeItem("buffer")
}
migrateBufferFileToLibrary()

const Heynote = {
    platform: platform,
    defaultFontFamily: "Hack", 
    defaultFontSize: isMobileDevice ? 16 : 12,

    buffer: {
        async load(path) {
            //console.log("loading", path)
            const content = localStorage.getItem(noteKey(path))
            return content === null ? '{"formatVersion":"1.0.0","name":"Scratch"}\n∞∞∞text-a;created=' + (new Date()).toISOString() + '\n' : content
        },

        async save(path, content) {
            //console.log("saving", path, content)
            localStorage.setItem(noteKey(path), content)
        },

        async create(path, content) {
            localStorage.setItem(noteKey(path), content)
        },

        async createDirectory(path) {
            if (!path) {
                return
            }
            const dirs = getStoredDirectories()
            dirs.push(path)
            setStoredDirectories(dirs)
        },

        async delete(path) {
            localStorage.removeItem(noteKey(path))
        },

        async isDirectoryEmpty(path) {
            const prefix = path ? path + "/" : ""
            const hasBuffer = Object.keys(localStorage).some((key) => {
                if (!key.startsWith(NOTE_KEY_PREFIX)) {
                    return false
                }
                const notePath = key.slice(NOTE_KEY_PREFIX.length)
                return notePath.startsWith(prefix)
            })
            const hasSubDirectory = getStoredDirectories().some((directoryPath) => directoryPath.startsWith(prefix))
            return !hasBuffer && !hasSubDirectory
        },

        async deleteDirectory(path) {
            const directories = getStoredDirectories().filter((directoryPath) => directoryPath !== path)
            setStoredDirectories(directories)
            return true
        },

        async move(path, newPath) {
            const content = localStorage.getItem(noteKey(path))
            localStorage.setItem(noteKey(newPath), content)
            localStorage.removeItem(noteKey(path))
        },

        async saveAndQuit(contents) {
            for (const [path, content] of contents) {
                localStorage.setItem(noteKey(path), content)
            }
        },

        async exists(path) {
            return localStorage.getItem(noteKey(path)) !== null
        },

        async getList() {
            //return {"scratch.txt": {name:"Scratch"}}
            const notes = {}
            for (let [key, content] of Object.entries(localStorage)) {
                if (key.startsWith(NOTE_KEY_PREFIX)) {
                    const path = key.slice(NOTE_KEY_PREFIX.length)
                    notes[path] = getNoteMetadata(content)
                }
            }
            if (notes["scratch.txt"] === undefined) {
                notes["scratch.txt"] = {name: "Scratch"}
            }
            return notes
        },

        async getDirectoryList() {
            const directories = new Set([
                ...getDirectoriesFromNotes(),
                ...getStoredDirectories(),
            ])
            return [...directories]
        },

        async close(path) {
            
        },

        _onChangeCallbacks: {},
        addOnChangeCallback(path, callback) {
            
        },
        removeOnChangeCallback(path, callback) {
            
        },

        pathSeparator: "/",

        setLibraryPathChangeCallback(callback) {
            
        },
    },

    mainProcess: {
        on(event, callback) {
            ipcRenderer.on(event, callback)
        },
        
        off(event, callback) {
            ipcRenderer.off(event, callback)
        },

        invoke(event, ...args) {
            switch (event) {
                case SAVE_TABS_STATE:
                    localStorage.setItem("openTabsState", JSON.stringify(args[0]))
                    break;
                case LOAD_TABS_STATE:
                    const tabsState = localStorage.getItem("openTabsState")
                    if (tabsState) {
                        return JSON.parse(tabsState)
                    }
                    return undefined
                case LIBRARY_SEARCH_START:
                    searchLocalLibrary(args[0])
                    return { ok: true }
                case LIBRARY_SEARCH_CANCEL:
                    return { ok: true }
            }
        }
    },

    settings: initialSettings,

    setSettings(settings) {
        localStorage.setItem("settings", JSON.stringify(settings))
        ipcRenderer.send(SETTINGS_CHANGE_EVENT, settings)
    },

    themeMode: {
        set: (mode) => {
            localStorage.setItem("theme", mode)
            themeCallback(mode)
            //console.log("set theme to", mode)
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
        const response = await fetch(
            CURRENCY_RATES_URL,
            getCurrencyFetchOptions(getClientId(), `${__APP_VERSION__}-web`),
        )
        currencyData = JSON.parse(await response.text())
        return currencyData
    },

    async getVersion() {
        return __APP_VERSION__ + " (" + __GIT_HASH__ + ")"
    },

    async getInitErrors() {
        
    },

    setWindowTitle(title) {
        document.title = title + " - Heynote"
    },

    async getSystemLocale() {
        return navigator.language
    },
}

function searchLocalLibrary(options) {
    const query = options?.query || ""
    if (!isLibrarySearchQueryLongEnough(query)) {
        ipcRenderer.send(LIBRARY_SEARCH_DONE, { searchId: options?.searchId })
        return
    }
    const flags = options.caseSensitive ? "g" : "gi"
    let pattern
    try {
        pattern = createLibrarySearchPattern(options, flags)
    } catch (error) {
        ipcRenderer.send(LIBRARY_SEARCH_ERROR, {
            searchId: options.searchId,
            message: `Invalid regular expression: ${error.message}`,
        })
        return
    }
    for (let [key, content] of Object.entries(localStorage)) {
        if (!key.startsWith(NOTE_KEY_PREFIX)) {
            continue
        }
        const buffer = key.slice(NOTE_KEY_PREFIX.length)
        const lines = content.split(/\r?\n/)
        lines.forEach((line, index) => {
            const submatches = []
            pattern.lastIndex = 0
            let match = pattern.exec(line)
            while (match) {
                submatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                })
                if (match[0].length === 0) {
                    pattern.lastIndex++
                }
                match = pattern.exec(line)
            }
            if (submatches.length === 0) {
                return
            }
            const normalizedMatch = normalizeLibrarySearchMatch({
                line,
                lineNumber: index + 1,
                submatches,
            })
            if (!normalizedMatch) {
                return
            }
            ipcRenderer.send(LIBRARY_SEARCH_MATCH, {
                searchId: options.searchId,
                type: "match",
                buffer,
                ...normalizedMatch,
            })
        })
    }
    ipcRenderer.send(LIBRARY_SEARCH_DONE, { searchId: options.searchId })
}

window.addEventListener("beforeunload", () => ipcRenderer.send(WINDOW_CLOSE_EVENT))

export { Heynote, ipcRenderer}

import { app } from "electron"
import Store from "electron-store"
import { isMac } from "./detect-platform"

// the process.type === "browser" check is needed because both the main and renderer process 
// imports this file, and app is not available in the renderer process
if (process.env.HEYNOTE_TEST_USER_DATA_DIR && process.type === "browser") {
    app.setPath("userData", process.env.HEYNOTE_TEST_USER_DATA_DIR)
}

const isDev = !!process.env.VITE_DEV_SERVER_URL

const schema = {
    additionalProperties: false,

    windowConfig: {
        type: "object",
        properties: {
            width: {type: "number"},
            height: {type: "number"},
            x: {type: "number"},
            y: {type: "number"},
            isMaximized: {type: "boolean"},
            isFullScreen: {type: "boolean"},
        },
        additionalProperties: false,
    },
    
    settings: {
        type: "object",
        properties: {
            "keymap": { "enum": ["default", "emacs"], default:"default" },
            "emacsMetaKey": { "enum": [null, "alt", "meta"], default: null },
            "keyBindings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["key", "command"],
                    "properties": {
                        "key": { "type": "string" },
                        "command": { "type": "string" }
                    },
                    "additionalProperties": false
                }
            },

            "showLineNumberGutter": {type: "boolean", default:true},
            "showFoldGutter": {type: "boolean", default:true},
            "showTabs": {type: "boolean", default: true},
            "showTabsInFullscreen": {type: "boolean", default: true},
            "autoUpdate": {type: "boolean", default: true},
            "allowBetaVersions": {type: "boolean", default: false},
            "enableGlobalHotkey": {type: "boolean", default: false},
            "globalHotkey": {type: "string", default: "CmdOrCtrl+Shift+H"},
            "bufferPath" : {type: "string", default: ""},
            "showInDock": {type: "boolean", default: true},
            "showInMenu": {type: "boolean", default: false},
            "alwaysOnTop": {type: "boolean", default: false},
            "bracketClosing": {type: "boolean", default: false},
            "indentType": {type: "string", default: "space"},
            "tabSize": {type: "integer", default: 4},
            "defaultBlockLanguage": {type: "string"},
            "defaultBlockLanguageAutoDetect": {type: "boolean"},
            "spellcheckEnabled": {type: "boolean", default:false},
            "showWhitespace": {type:"boolean", default:false},
            "cursorBlinkRate": {type: "integer", default: 1000},

            // when default font settings are used, fontFamily and fontSize is not specified in the 
            // settings file, so that it's possible for us to change the default settings in the 
            // future and have it apply to existing users
            "fontFamily": {type: "string"}, 
            "fontSize": {type: "integer"}, 

            "searchSettings": {
                type: "object",
                properties: {
                    onlyCurrentBlock: {type: "boolean"},
                    caseSensitive: {type: "boolean"},
                    wholeWord: {type: "boolean"},
                    regexp: {type: "boolean"},
                },
            },
        },
    },

    theme: {type: "string", default: "system"},

    openTabsState: {
        type: "object",
        properties: {
            currentBufferPath: {type: "string"},
            openTabs: {
                type: "array",
                items: {
                    type: "string",
                },
            },
            recentBuffers: {
                type: "array",
                items: {
                    type: "string",
                },
            },
        },
    },

    currency: {
        type: "object",
        properties: {
            data: {type: "object"},
            timeFetched: {type: "number"},
        },
    },
}

const defaults = {
    settings: {
        keymap: "default",
        emacsMetaKey: isMac ? "meta" : "alt",
        keyBindings: [],
        showLineNumberGutter: true,
        showFoldGutter: true,
        autoUpdate: true,
        allowBetaVersions: false,
        enableGlobalHotkey: false,
        globalHotkey: "CmdOrCtrl+Shift+H",
        bufferPath: "",
        showInDock: true,
        showInMenu: false,
        alwaysOnTop: false,
        bracketClosing: false,
        indentType: "space",
        tabSize: 4,
        searchSettings: {
            onlyCurrentBlock: true,
            caseSensitive: false,
            wholeWord: false,
            regexp: false,
        },
        spellcheckEnabled: false,
        showWhitespace: false,
        cursorBlinkRate: 1000,
    },
    theme: "system",
}

export default new Store({schema, defaults, name: isDev ? "config-dev" : "config"})

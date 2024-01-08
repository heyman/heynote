import Store from "electron-store"
import { isMac } from "./detect-platform"

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
            "showLineNumberGutter": {type: "boolean", default:true},
            "showFoldGutter": {type: "boolean", default:true},
            "autoUpdate": {type: "boolean", default: true},
            "allowBetaVersions": {type: "boolean", default: false},
            "enableGlobalHotkey": {type: "boolean", default: false},
            "globalHotkey": {type: "string", default: "CmdOrCtrl+Shift+H"},
            "bufferPath" : {type: "string", default: ""},
            "showInDock": {type: "boolean", default: true},
            "showInMenu": {type: "boolean", default: false},
            "bracketClosing": {type: "boolean", default: false},
            "fontFamily": {type: "string"},
            "fontSize": {type: "integer"},
        },
    },

    theme: {type: "string", default: "system"},

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
        showLineNumberGutter: true,
        showFoldGutter: true,
        autoUpdate: true,
        allowBetaVersions: false,
        enableGlobalHotkey: false,
        globalHotkey: "CmdOrCtrl+Shift+H",
        bufferPath: "",
        showInDock: true,
        showInMenu: false,
        bracketClosing: false,
        fontFamily: null, // we use null for the default font family and size, since we could then change
        fontSize: null,   // the default font family and size in the future and have it apply to existing users
    },
    theme: "system",
}

export default new Store({schema, defaults, name: isDev ? "config-dev" : "config"})

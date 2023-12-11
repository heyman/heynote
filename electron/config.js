import Store from "electron-store"

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
            "allowBetaVersions": {type: "boolean", default: false},
            "enableGlobalHotkey": {type: "boolean", default: false},
            "globalHotkey": {type: "string", default: "CmdOrCtrl+Shift+H"},
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
        emacsMetaKey: "meta",
        showLineNumberGutter: true,
        showFoldGutter: true,
        allowBetaVersions: false,
        enableGlobalHotkey: false,
        globalHotkey: "CmdOrCtrl+Shift+H",
    },
    theme: "system",
}

export default new Store({schema, defaults, name: isDev ? "config-dev" : "config"})

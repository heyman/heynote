import Store from "electron-store"

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
        },
    },

    theme: {type: "string", default: "system"},
}

const defaults = {
    settings: {
        keymap: "default",
        emacsMetaKey: "meta",
        showLineNumberGutter: true,
        showFoldGutter: true,
    },
    theme: "system",
}

export default new Store({schema, defaults})

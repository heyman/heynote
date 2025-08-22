import { keymap } from "@codemirror/view"
import { Prec } from "@codemirror/state"

import { keyName } from "w3c-keyname"


import { HEYNOTE_COMMANDS } from "./commands.js"


const cmd = (key, command, scope) => ({key, command, scope})
const cmdShift = (key, command, shiftCommand) => {
    return [
        cmd(key, command),
        cmd(`Shift-${key}`, shiftCommand),
    ]
}

const isMac = window.heynote.platform.isMac
const isLinux = window.heynote.platform.isLinux
const isWindows = window.heynote.platform.isWindows

export const DEFAULT_KEYMAP = [
    cmd("Enter", "insertNewlineAndIndent"),
    
    cmd("Mod-a", "selectAll"),
    cmd("Mod-Enter", "addNewBlockAfterCurrent"),
    cmd("Mod-Shift-Enter", "addNewBlockAfterLast"),
    cmd("Alt-Enter", "addNewBlockBeforeCurrent"),
    cmd("Alt-Shift-Enter", "addNewBlockBeforeFirst"),
    cmd("Mod-Alt-Enter", "insertNewBlockAtCursor"),
    ...cmdShift("ArrowLeft", "cursorCharLeft", "selectCharLeft"),
    ...cmdShift("ArrowRight", "cursorCharRight", "selectCharRight"),
    ...cmdShift("ArrowUp", "cursorLineUp", "selectLineUp"),
    ...cmdShift("ArrowDown", "cursorLineDown", "selectLineDown"),
    ...cmdShift("Ctrl-ArrowLeft", "cursorGroupLeft", "selectGroupLeft"),
    ...cmdShift("Ctrl-ArrowRight", "cursorGroupRight", "selectGroupRight"),
    ...cmdShift("Alt-ArrowLeft", "cursorGroupLeft", "selectGroupLeft"),
    ...cmdShift("Alt-ArrowRight", "cursorGroupRight", "selectGroupRight"),
    ...cmdShift("Mod-ArrowUp", "cursorPreviousBlock", "selectPreviousBlock"),
    ...cmdShift("Mod-ArrowDown", "cursorNextBlock", "selectNextBlock"),
    ...cmdShift("Ctrl-ArrowUp", "cursorPreviousParagraph", "selectPreviousParagraph"),
    ...cmdShift("Ctrl-ArrowDown", "cursorNextParagraph", "selectNextParagraph"),
    ...cmdShift("PageUp", "cursorPageUp", "selectPageUp"),
    ...cmdShift("PageDown", "cursorPageDown", "selectPageDown"),
    ...cmdShift("Home", "cursorLineBoundaryBackward", "selectLineBoundaryBackward"),
    ...cmdShift("End", "cursorLineBoundaryForward", "selectLineBoundaryForward"),
    ...cmdShift("Ctrl-Home", "cursorDocStart", "selectDocStart"),
    ...cmdShift("Ctrl-End", "cursorDocEnd", "selectDocEnd"),
    cmd("Alt-Mod-Shift-ArrowUp", "moveCurrentBlockUp"),
    cmd("Alt-Mod-Shift-ArrowDown", "moveCurrentBlockDown"),
    cmd("Alt-Shift-d", "insertDateAndTime"),
    cmd("Backspace", "deleteCharBackward"),
    cmd("Delete", "deleteCharForward"),
    cmd("Escape", "simplifySelection"),
    cmd("Ctrl-Backspace", "deleteGroupBackward"),
    cmd("Ctrl-Delete", "deleteGroupForward"),
    ...(isMac ? [
        cmd("Alt-Backspace", "deleteGroupBackward"),
        cmd("Alt-Delete", "deleteGroupForward"),
        cmd("Mod-Backspace", "deleteLineBoundaryBackward"),
        cmd("Mod-Delete", "deleteLineBoundaryForward"),
        ...cmdShift("Mod-ArrowLeft", "cursorLineBoundaryBackward", "selectLineBoundaryBackward"),
        ...cmdShift("Mod-ArrowRight", "cursorLineBoundaryForward", "selectLineBoundaryForward"),
    ] : []),
    
    cmd("Alt-ArrowUp", "moveLineUp"),
    cmd("Alt-ArrowDown", "moveLineDown"),
    cmd("Mod-Shift-k", "deleteLine"),
    cmd("Mod-Alt-ArrowDown", "newCursorBelow"),
    cmd("Mod-Alt-ArrowUp", "newCursorAbove"),
    cmd("Mod-Shift-d", "deleteBlock"),
    cmd(isMac ? "Cmd-Shift-[" : "Ctrl-Shift-[", "foldCode"),
    cmd(isMac ? "Cmd-Shift-]" : "Ctrl-Shift-]", "unfoldCode"),

    // search keymap
    cmd("Mod-d", "selectNextOccurrence"),
    cmd("Mod-f", "openSearchPanel", "editor search-panel"),
    cmd("F3", "findNext", "editor search-panel"),
    cmd("Mod-g", "findNext", "editor search-panel"),
    cmd("Shift-F3", "findPrevious", "editor search-panel"),
    cmd("Shift-Mod-g", "findPrevious", "editor search-panel"),
    cmd("Escape", "closeSearchPanel", "editor search-panel"),
    cmd("Mod-Shift-l", "selectSelectionMatches"),
    cmd("Mod-Shift-l", "nothing"), // prevent default Electron behavior when selectSelectionMatches doesn't match anything
    //cmd("Mod-Alt-g", "gotoLine"),

    cmd("Mod-c", "copy"),
    cmd("Mod-v", "paste"),
    cmd("Mod-z", "undo"),
    cmd("Mod-Shift-z", "redo"),
    ...(isWindows || isLinux ? [
        cmd("Mod-y", "redo"),
    ] : []),

    cmd("Tab", "indentMore"),
    cmd("Shift-Tab", "indentLess"),
    //cmd("Alt-ArrowLeft", "cursorSubwordBackward"),
    //cmd("Alt-ArrowRight", "cursorSubwordForward"),

    cmd("Mod-l", "openLanguageSelector"),
    cmd("Mod-p", "openBufferSelector"),
    cmd("Mod-Shift-p", "openCommandPalette"),
    cmd("Mod-s", "openMoveToBuffer"),
    cmd("Mod-n", "openCreateNewBuffer"),

    cmd("Alt-Shift-f", "formatBlockContent"),

    cmd("Mod-/", "toggleComment"),
    cmd("Alt-Shift-a", "toggleBlockComment"),
    
    // fold blocks
    ...(isMac ? [
        cmd("Alt-Cmd-[", "foldBlock"),
        cmd("Alt-Cmd-]", "unfoldBlock"),
        cmd("Alt-Cmd-.", "toggleBlockFold")
    ] : [
        cmd("Alt-Ctrl-[", "foldBlock"),
        cmd("Alt-Ctrl-]", "unfoldBlock"),
        cmd("Alt-Ctrl-.", "toggleBlockFold")
    ]),

    // tabs
    cmd("Mod-w", "closeCurrentTab"),
    cmd("Mod-Shift-t", "reopenLastClosedTab"),
    cmd("Ctrl-Tab", "nextTab"),
    cmd("Ctrl-Shift-Tab", "previousTab"),
    cmd("Mod-1", "switchToTab1"),
    cmd("Mod-2", "switchToTab2"),
    cmd("Mod-3", "switchToTab3"),
    cmd("Mod-4", "switchToTab4"),
    cmd("Mod-5", "switchToTab5"),
    cmd("Mod-6", "switchToTab6"),
    cmd("Mod-7", "switchToTab7"),
    cmd("Mod-8", "switchToTab8"),
    cmd("Mod-9", "switchToTab9"),
    cmd("Mod-0", "switchToLastTab"),

    // search
    //cmd("Mod-f", "openSearchPanel"),
    //cmd("F3", "findNext"),
    //cmd("Mod-g", "findNext"),
    //cmd("Shift-F3", "findPrevious"),
    //cmd("Shift-Mod-g", "findPrevious"),
    //cmd("Mod-Alt-g", "gotoLine"),
    //cmd("Mod-d", "selectNextOccurrence"),
    /*
    - Mod-f: [`openSearchPanel`](https://codemirror.net/6/docs/ref/#search.openSearchPanel)
    - F3, Mod-g: [`findNext`](https://codemirror.net/6/docs/ref/#search.findNext)
    - Shift-F3, Shift-Mod-g: [`findPrevious`](https://codemirror.net/6/docs/ref/#search.findPrevious)
    - Mod-Alt-g: [`gotoLine`](https://codemirror.net/6/docs/ref/#search.gotoLine)
    - Mod-d: [`selectNextOccurrence`](https://codemirror.net/6/docs/ref/#search.selectNextOccurrence)
    */
]

export const DEFAULT_NOT_EMACS_KEYMAP = [
    cmd("Mod-x", "cut"),
]

export const EMACS_KEYMAP = [
    cmd("Ctrl-w", "cut"),
    cmd("Ctrl-y", "paste"),
    cmd("EmacsMeta-w", "copy"),
    cmd("Ctrl-Space", "toggleSelectionMarkMode"),
    cmd("Ctrl-g", "selectionMarkModeCancel"),
    cmd("Escape", "selectionMarkModeCancel"),
    cmd("Ctrl-o", "splitLine"),
    cmd("Ctrl-d", "deleteCharForward"),
    cmd("Ctrl-h", "deleteCharBackward"),
    cmd("Ctrl-k", "deleteToLineEnd"),
    cmd("Ctrl-t", "transposeChars"),
    cmd("Ctrl-Shift--", "undo"),
    cmd("Ctrl-.", "redo"),
    cmd("Ctrl-s", "findNext", "editor search-panel"),
    cmd("Ctrl-g", "closeSearchPanel", "search-panel"),
    ...cmdShift("Ctrl-v", "cursorPageDown", "selectPageDown"),
    ...cmdShift("Ctrl-b", "cursorCharLeft", "selectCharLeft"),
    ...cmdShift("Ctrl-f", "cursorCharRight", "selectCharRight"),
    ...cmdShift("Ctrl-a", "cursorLineStart", "selectLineStart"),
    ...cmdShift("Ctrl-e", "cursorLineEnd", "selectLineEnd"),
    // tabs
    cmd("Ctrl-x k", "closeCurrentTab"),
]


function keymapFromSpec(specs, editor) {
    return keymap.of(specs.map((spec) => {
        let key = spec.key
        if (key.indexOf("EmacsMeta") != -1) {
            key = key.replace("EmacsMeta", editor.emacsMetaKey === "alt" ? "Alt" : "Meta")
        }
        return {
            key: key,
            //preventDefault: true,
            preventDefault: false,
            run: (view) => {
                //console.log("run()", spec.key, spec.command)
                const command = HEYNOTE_COMMANDS[spec.command]
                if (!command) {
                    console.error(`Command not found: ${spec.command} (${spec.key})`)
                    return false
                }
                return command.run(editor)(view)
            },
            scope: spec.scope,
        }
    }))
}


function getCombinedKeymapSpec(keymapName, userKeymap) {
    return [
        ...userKeymap,
        ...(keymapName === "emacs" ? [...EMACS_KEYMAP, ...DEFAULT_KEYMAP] : [...DEFAULT_NOT_EMACS_KEYMAP, ...DEFAULT_KEYMAP]),
    ]
}

export function getKeymapExtensions(editor, keymap, keyBindings) {
    return [
        keymapFromSpec(getCombinedKeymapSpec(keymap, keyBindings), editor)
    ]
}

/**
 * @returns Human readable version of a key binding
 */
export function getKeyBindingLabel(binding, emacsMetaKey, separator=" ") {
    emacsMetaKey = emacsMetaKey === "meta" ? "Meta" : (emacsMetaKey === "alt" ? "Alt" : emacsMetaKey)

    const parts = binding.split(" ")
    return parts.map((part) => {
        return part.split("-").map((key) => {
            switch(key) {
                case "Mod":
                    return window.heynote.platform.isMac ? "⌘" : "Ctrl"
                case "Alt":
                    return window.heynote.platform.isMac ? "⌥" : "Alt"
                case "EmacsMeta":
                    return emacsMetaKey === "Meta" ? "Meta" : (emacsMetaKey === "Alt" ? "Alt" : emacsMetaKey)
                case "Meta":
                    return window.heynote.platform.isMac ? "⌘" : "Meta"
                case "Shift":
                    return "⇧"
                case "Control":
                    return "Ctrl"
            }
            if (key.match(/^[a-z]$/)) {
                return key.toUpperCase()
            }
            return key
        }).join("+")
    }).join(separator)
}



function canonicalizeKey(keyString) {
    const strokes = keyString.trim().split(/\s+/)
    return strokes.map(stroke => _canonicalizeSingleStroke(stroke)).join(' ')
}
function _canonicalizeSingleStroke(strokeString) {
    const parts = strokeString.split('-')
    const key = parts.pop()
    const modifiers = parts.map(mod => mod.toLowerCase())

    const normalizedModifiers = modifiers.map(mod => {
        switch (mod) {
            case 'mod': return isMac ? 'meta' : 'ctrl'
            case 'control': case 'ctrl': return 'ctrl'
            case 'shift': return 'shift'
            case 'alt': case 'option': return 'alt'
            case 'meta': case 'cmd': case 'command': return 'meta'
            default: return mod
        }
    })

    const order = ['ctrl', 'alt', 'shift', 'meta']
    const sortedModifiers = normalizedModifiers.sort((a, b) => {
        return order.indexOf(a) - order.indexOf(b)
    })

    const uniqueModifiers = [...new Set(sortedModifiers)]

    return uniqueModifiers.length > 0
        ? uniqueModifiers.join('-') + '-' + key.toLowerCase()
        : key.toLowerCase()
}


/**
 * Returns the first bound key for a command (in label format, i.e. Mod replaced with ⌘ etc.)
 */
export function getAllKeyBindingsForCommand(command, keymapName, userKeymap, emacsMetaKey) {
    //console.log("debug:", "getKeyBindingForCommand", command, keymapName, userKeymap, emacsMetaKey)
    const capturingCommands = new Set([
        "nothing", 
        "toggleAlwaysOnTop", 
        "openLanguageSelector", "openBufferSelector", "openCreateNewBuffer", "openMoveToBuffer", "openCommandPalette", 
        "closeCurrentTab", "reopenLastClosedTab", "nextTab", "previousTab", 
        "switchToTab1", "switchToTab2", "switchToTab3", "switchToTab4", "switchToTab5", "switchToTab6", "switchToTab7", "switchToTab8", "switchToTab9", "switchToLastTab"
    ])

    const capturedKeys = new Set()
    const bindings = []
    

    for (const binding of getCombinedKeymapSpec(keymapName, userKeymap)) {
        const key = canonicalizeKey(binding.key)
        if (binding.command === command && !capturedKeys.has(key)) {
            bindings.push(getKeyBindingLabel(binding.key, emacsMetaKey))
        }
        
        if (capturingCommands.has(binding.command)) {
            capturedKeys.add(key)
        }
    }
    return bindings
}

export function getCommandKeyBindings(keymapName, userKeymap, emacsMetaKey) {
    return Object.fromEntries(Object.keys(HEYNOTE_COMMANDS).map((cmd) => {
        return [cmd, getAllKeyBindingsForCommand(cmd, keymapName, userKeymap, emacsMetaKey)]
    }))
}

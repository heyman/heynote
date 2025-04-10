import { keymap } from "@codemirror/view"
import { Prec } from "@codemirror/state"

import { HEYNOTE_COMMANDS } from "./commands.js"


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
                return command(editor)(view)
            },
        }
    }))
}

const cmd = (key, command) => ({key, command})
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
    ] : []),
    
    cmd("Alt-ArrowUp", "moveLineUp"),
    cmd("Alt-ArrowDown", "moveLineDown"),
    cmd("Mod-Shift-k", "deleteLine"),
    cmd("Mod-Alt-ArrowDown", "newCursorBelow"),
    cmd("Mod-Alt-ArrowUp", "newCursorAbove"),
    cmd("Mod-Shift-d", "deleteBlock"),
    cmd("Mod-d", "selectNextOccurrence"),
    cmd(isMac ? "Cmd-Alt-[" : "Ctrl-Shift-[", "foldCode"),
    cmd(isMac ? "Cmd-Alt-]" : "Ctrl-Shift-]", "unfoldCode"),

    cmd("Mod-c", "copy"),
    cmd("Mod-v", "paste"),
    cmd("Mod-x", "cut"),
    cmd("Mod-z", "undo"),
    cmd("Mod-Shift-z", "redo"),
    ...(isWindows || isLinux ? [
        cmd("Mod-y", "redo"),
    ] : []),

    cmd("Tab", "indentMore"),
    cmd("Shift-Tab", "indentLess"),
    //cmd("Alt-ArrowLeft", "cursorSubwordBackward"),
    //cmd("Alt-ArrowRight", "cursorSubwordForward"),
    cmd("Ctrl-Space", "toggleEmacsMarkMode"),
    cmd("Ctrl-g", "emacsCancel"),

    cmd("Mod-l", "openLanguageSelector"),
    cmd("Mod-p", "openBufferSelector"),
    cmd("Mod-s", "openMoveToBuffer"),
    cmd("Mod-n", "openCreateNewBuffer"),

    cmd("Alt-Shift-f", "formatBlockContent"),

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

export const EMACS_KEYMAP = [
    cmd("Ctrl-w", "cut"),
    cmd("Ctrl-y", "paste"),
    cmd("EmacsMeta-w", "copy"),
    cmd("Ctrl-Space", "toggleEmacsMarkMode"),
    cmd("Ctrl-g", "emacsCancel"),
    cmd("Escape", "emacsCancel"),
    cmd("Ctrl-o", "splitLine"),
    cmd("Ctrl-d", "deleteCharForward"),
    cmd("Ctrl-h", "deleteCharBackward"),
    cmd("Ctrl-k", "deleteToLineEnd"),
    cmd("Ctrl-t", "transposeChars"),
    cmd("Ctrl-Shift--", "undo"),
    cmd("Ctrl-.", "redo"),
    ...cmdShift("Ctrl-v", "cursorPageDown", "selectPageDown"),
    ...cmdShift("Ctrl-b", "cursorCharLeft", "selectCharLeft"),
    ...cmdShift("Ctrl-f", "cursorCharRight", "selectCharRight"),
    ...cmdShift("Ctrl-a", "cursorLineStart", "selectLineStart"),
    ...cmdShift("Ctrl-e", "cursorLineEnd", "selectLineEnd"),
    ...DEFAULT_KEYMAP,
]



export function heynoteKeymap(editor, keymap, userKeymap) {
    //return [
    //    keymapFromSpec([
    //        ...Object.entries(userKeymap).map(([key, command]) => cmd(key, command)),
    //        ...keymap,
    //    ], editor),
    //]

    // merge the default keymap with the custom keymap
    const defaultKeys = Object.fromEntries(keymap.map(km => [km.key, km.command]))
    //let mergedKeys = Object.entries({...defaultKeys, ...Object.fromEntries(userKeymap.map(km => [km.key, km.command]))}).map(([key, command]) => cmd(key, command))
    let mergedKeys = Object.entries({...defaultKeys, ...userKeymap}).map(([key, command]) => cmd(key, command))
    //console.log("userKeys:", userKeymap)
    //console.log("mergedKeys:", mergedKeys)

    return [
        Prec.high(keymapFromSpec(mergedKeys, editor)),
    ]
}

import {
    undo, redo, 
    cursorGroupLeft, cursorGroupRight, selectGroupLeft, selectGroupRight, 
    simplifySelection,
    deleteCharForward, deleteCharBackward, deleteToLineEnd,
    splitLine,
    transposeChars,
    cursorPageDown,
    cursorCharLeft, selectCharLeft,
    cursorCharRight, selectCharRight,
    cursorLineUp, selectLineUp,
    cursorLineDown, selectLineDown,
    cursorLineStart, selectLineStart,
    cursorLineEnd, selectLineEnd,
} from "@codemirror/commands"

import * as codeMirrorCommands from "@codemirror/commands"
import { addNewBlockAfterCurrent, addNewBlockBeforeCurrent, addNewBlockAfterLast, addNewBlockBeforeFirst } from "./block/commands.js"

const HEYNOTE_COMMANDS = {
    undo,
    redo,

    addNewBlockAfterCurrent, addNewBlockBeforeCurrent, addNewBlockAfterLast, addNewBlockBeforeFirst,
}

for (const [key, cmCommand] of Object.entries(codeMirrorCommands)) {
    HEYNOTE_COMMANDS[key] = (editor) => cmCommand(editor.view)
}


export function registerCommands(commands) {
    for (const [name, command] of Object.entries(commands)) {
        HEYNOTE_COMMANDS[name] = command
    }
}


export { HEYNOTE_COMMANDS }

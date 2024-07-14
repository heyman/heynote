import { keymap } from "@codemirror/view"
//import { EditorSelection, EditorState } from "@codemirror/state"
import {
    indentLess, indentMore, redo,
} from "@codemirror/commands"

import { 
    insertNewBlockAtCursor, 
    addNewBlockBeforeCurrent, addNewBlockAfterCurrent,
    addNewBlockBeforeFirst, addNewBlockAfterLast,
    moveLineUp, moveLineDown, 
    selectAll, 
    gotoPreviousBlock, gotoNextBlock, 
    selectNextBlock, selectPreviousBlock,
    gotoPreviousParagraph, gotoNextParagraph, 
    selectNextParagraph, selectPreviousParagraph,
    newCursorBelow, newCursorAbove,
} from "./block/commands.js"
import { pasteCommand, copyCommand, cutCommand } from "./copy-paste.js"

import { formatBlockContent } from "./block/format-code.js"
import { deleteLine } from "./block/delete-line.js"


export function keymapFromSpec(specs) {
    return keymap.of(specs.map((spec) => {
        if (spec.run) {
            if ("preventDefault" in spec) {
                return spec
            } else {
                return {...spec, preventDefault: true}
            }
        } else {
            const [key, run] = spec
            return {
                key,
                run,
                preventDefault: true,
            }
        }
    }))
}

export function heynoteKeymap(editor) {
    return keymapFromSpec([
        ["Mod-c", copyCommand(editor)],
        ["Mod-v", pasteCommand],
        ["Mod-x", cutCommand(editor)],
        ["Tab", indentMore],
        ["Shift-Tab", indentLess],
        ["Alt-Shift-Enter", addNewBlockBeforeFirst(editor)],
        ["Mod-Shift-Enter", addNewBlockAfterLast(editor)],
        ["Alt-Enter", addNewBlockBeforeCurrent(editor)],
        ["Mod-Enter", addNewBlockAfterCurrent(editor)],
        ["Mod-Alt-Enter", insertNewBlockAtCursor(editor)],
        ["Mod-a", selectAll],
        ["Alt-ArrowUp", moveLineUp],
        ["Alt-ArrowDown", moveLineDown],
        ["Mod-l", () => editor.openLanguageSelector()],
        ["Alt-Shift-f", formatBlockContent],
        ["Mod-Alt-ArrowDown", newCursorBelow],
        ["Mod-Alt-ArrowUp", newCursorAbove],
        ["Mod-Shift-k", deleteLine],
        ["Mod-Shift-z", redo],
        {key:"Mod-ArrowUp", run:gotoPreviousBlock, shift:selectPreviousBlock},
        {key:"Mod-ArrowDown", run:gotoNextBlock, shift:selectNextBlock},
        {key:"Ctrl-ArrowUp", run:gotoPreviousParagraph, shift:selectPreviousParagraph},
        {key:"Ctrl-ArrowDown", run:gotoNextParagraph, shift:selectNextParagraph},
    ])
}

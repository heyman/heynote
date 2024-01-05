import { keymap } from "@codemirror/view"
//import { EditorSelection, EditorState } from "@codemirror/state"
import {
    indentLess, indentMore, 
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

import { formatBlockContent } from "./block/format-code.js"


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
        ["Tab", indentMore],
        ["Shift-Tab", indentLess],
        ["Alt-Shift-Enter", addNewBlockBeforeFirst],
        ["Mod-Shift-Enter", addNewBlockAfterLast],
        ["Alt-Enter", addNewBlockBeforeCurrent],
        ["Mod-Enter", addNewBlockAfterCurrent],
        ["Mod-Alt-Enter", insertNewBlockAtCursor],
        ["Mod-a", selectAll],
        ["Alt-ArrowUp", moveLineUp],
        ["Alt-ArrowDown", moveLineDown],
        ["Mod-l", () => editor.openLanguageSelector()],
        ["Alt-Shift-f", formatBlockContent],
        ["Mod-Alt-ArrowDown", newCursorBelow],
        ["Mod-Alt-ArrowUp", newCursorAbove],
        {key:"Mod-ArrowUp", run:gotoPreviousBlock, shift:selectPreviousBlock},
        {key:"Mod-ArrowDown", run:gotoNextBlock, shift:selectNextBlock},
        {key:"Ctrl-ArrowUp", run:gotoPreviousParagraph, shift:selectPreviousParagraph},
        {key:"Ctrl-ArrowDown", run:gotoNextParagraph, shift:selectNextParagraph},
    ])
}

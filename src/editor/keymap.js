import { EditorView, keymap } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"
import {
    indentWithTab, insertTab, indentLess, indentMore, 
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
}from "@codemirror/commands"

import { 
    insertNewBlockAtCursor, 
    addNewBlockAfterCurrent, 
    moveLineUp, moveLineDown, 
    selectAll, 
    gotoPreviousBlock, gotoNextBlock, 
    selectNextBlock, selectPreviousBlock,
    gotoPreviousParagraph, gotoNextParagraph, 
    selectNextParagraph, selectPreviousParagraph,
} from "./block/commands.js"

import { formatBlockContent } from "./block/format-code.js"


function keymapFromSpec(specs) {
    return keymap.of(specs.map((spec) => {
        if (spec.run) {
            return {...spec, preventDefault: true}
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
        ["Mod-Enter", addNewBlockAfterCurrent],
        ["Mod-Shift-Enter", insertNewBlockAtCursor],
        ["Mod-a", selectAll],
        ["Alt-ArrowUp", moveLineUp],
        ["Alt-ArrowDown", moveLineDown],
        ["Mod-l", () => editor.openLanguageSelector()],
        ["Alt-Shift-f", formatBlockContent],
        {key:"Mod-ArrowUp", run:gotoPreviousBlock, shift:selectPreviousBlock},
        {key:"Mod-ArrowDown", run:gotoNextBlock, shift:selectNextBlock},
        {key:"Ctrl-ArrowUp", run:gotoPreviousParagraph, shift:selectPreviousParagraph},
        {key:"Ctrl-ArrowDown", run:gotoNextParagraph, shift:selectNextParagraph},
    ])
}

export function emacsKeymap(editor) {
    return [
        heynoteKeymap(editor),
        keymapFromSpec([
            ["Ctrl-Shift--", undo],
            ["Ctrl-.", redo],
            ["Ctrl-g", simplifySelection],
            {key:"Ctrl-ArrowLeft", run:cursorGroupLeft, shift:selectGroupLeft},
            {key:"Ctrl-ArrowRight", run:cursorGroupRight, shift:selectGroupRight},
            
            ["Ctrl-d", deleteCharForward],
            ["Ctrl-h", deleteCharBackward],
            ["Ctrl-k", deleteToLineEnd],
            ["Ctrl-o", splitLine],
            ["Ctrl-t", transposeChars],
            ["Ctrl-v", cursorPageDown],

            { key: "Ctrl-b", run: cursorCharLeft, shift: selectCharLeft, preventDefault: true },
            { key: "Ctrl-f", run: cursorCharRight, shift: selectCharRight },
            { key: "Ctrl-p", run: cursorLineUp, shift: selectLineUp },
            { key: "Ctrl-n", run: cursorLineDown, shift: selectLineDown },
            { key: "Ctrl-a", run: cursorLineStart, shift: selectLineStart },
            { key: "Ctrl-e", run: cursorLineEnd, shift: selectLineEnd },
        ]),
    ]
}

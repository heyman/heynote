import { EditorView, keymap } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"
import {
    indentWithTab, insertTab, indentLess, indentMore, 
    undo, redo, 
    cursorGroupLeft, cursorGroupRight, selectGroupLeft, selectGroupRight,
} from "@codemirror/commands"
import { 
    insertNewBlockAtCursor, 
    addNewBlockAfterCurrent, 
    moveLineUp, moveLineDown, 
    selectAll, 
    gotoPreviousBlock, gotoNextBlock, 
    selectNextBlock, selectPreviousBlock,
    gotoPreviousParagraph, gotoNextParagraph, 
    selectNextParagraph, selectPreviousParagraph,
} from "./block/commands.js";


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
            {key:"Ctrl-ArrowLeft", run:cursorGroupLeft, shift:selectGroupLeft},
            {key:"Ctrl-ArrowRight", run:cursorGroupRight, shift:selectGroupRight},
        ]),
    ]
}

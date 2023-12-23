import { keymap } from "@codemirror/view"
import { Vim, vim } from "@replit/codemirror-vim"
//import { EditorSelection, EditorState } from "@codemirror/state"
import {
    indentLess, indentMore, 
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
    newCursorBelow, newCursorAbove,
} from "./block/commands.js"

import { formatBlockContent } from "./block/format-code.js"


export function keymapFromSpec(specs) {
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
        ["Mod-Alt-ArrowDown", newCursorBelow],
        ["Mod-Alt-ArrowUp", newCursorAbove],
        {key:"Mod-ArrowUp", run:gotoPreviousBlock, shift:selectPreviousBlock},
        {key:"Mod-ArrowDown", run:gotoNextBlock, shift:selectNextBlock},
        {key:"Ctrl-ArrowUp", run:gotoPreviousParagraph, shift:selectPreviousParagraph},
        {key:"Ctrl-ArrowDown", run:gotoNextParagraph, shift:selectNextParagraph},
    ])
}

export function vimKeymap(editor) {
    //Vim.defineEx("DeleteLineFix", (editor) => {
       //editor.view.cm.execCommand("deleteLine")
    //})

  //Vim.map("\\\\", ":DeleteLineFix", "normal")
    return [heynoteKeymap(editor), vim()]
}
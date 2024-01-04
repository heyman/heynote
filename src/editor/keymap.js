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
    newCursorBelow, newCursorAbove, formatBold, formatItalic, formatTitle,
} from "./block/commands.js"

import { formatBlockContent } from "./block/format-code.js"
import { EditorState } from "@codemirror/state"
import { getActiveNoteBlock } from "./block/block.js"


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

// Custom keymaps for markdown formatting
const markdownKeymaps = {
    language: "markdown",
    keymap: keymap.of([
        {key:"Ctrl-b", run:formatBold},
        {key:"Ctrl-i", run:formatItalic},
        {key:"Ctrl-t", run:formatTitle}
    ])
}

export function languageKeymap(keymapComp){
    // First, we check each transaction to see if the block language changed in some way
    return EditorState.transactionExtender.of((tr)=>{
        if(getActiveNoteBlock(tr.startState).language.name != getActiveNoteBlock(tr.state).language.name){
            let targetLanguageKeymap;
            // If it did, we assign a new keymap set for the language, or none if not defined
            switch(getActiveNoteBlock(tr.state).language.name){
                case "markdown":
                    targetLanguageKeymap = markdownKeymaps.keymap;
                break;
                default:
                    targetLanguageKeymap = [];
                break;
            }
            return {
                effects: keymapComp.reconfigure(targetLanguageKeymap)
            }
        }
    })
}
import { keymap } from "@codemirror/view"
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

import CONFIG from "../../electron/config.js"


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

function setBuffer(b) {
    console.log(b)
    console.log('call save')
    CONFIG.set("settings.bufferSuffix", b)
    console.log('call load')
}

function setBuffer1(state, dispatch) {
    setBuffer(1)
}

function setBuffer2(state, dispatch) {
    setBuffer(2)
}

function setBuffer3(state, dispatch) {
    setBuffer(3)
}

function setBuffer4(state, dispatch) {
    setBuffer(4)
}

function setBuffer5(state, dispatch) {
    setBuffer(5)
}

function setBuffer6(state, dispatch) {
    setBuffer(6)
}

 function setBuffer7(state, dispatch) {
    setBuffer(7)
}

function setBuffer8(state, dispatch) {
    setBuffer(8)
}

function setBuffer9(state, dispatch) {
    setBuffer(9)
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
        ["Mod-1", setBuffer1],
        ["Mod-2", setBuffer2],
        ["Mod-3", setBuffer3],
        ["Mod-4", setBuffer4],
        ["Mod-5", setBuffer5],
        ["Mod-6", setBuffer6],
        ["Mod-7", setBuffer7],
        ["Mod-8", setBuffer8],
        ["Mod-9", setBuffer9],
    ])
}

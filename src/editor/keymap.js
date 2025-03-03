import { keymap } from "@codemirror/view"
//import { EditorSelection, EditorState } from "@codemirror/state"
import { Prec } from "@codemirror/state"
import {
    indentLess, indentMore, redo,
} from "@codemirror/commands"

import { HEYNOTE_COMMANDS } from "./commands.js"
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
    deleteBlock,
} from "./block/commands.js"
import { pasteCommand, copyCommand, cutCommand } from "./copy-paste.js"

import { formatBlockContent } from "./block/format-code.js"
import { deleteLine } from "./block/delete-line.js"


export function keymapFromSpecOld(specs) {
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


function keymapFromSpec(specs, editor) {
    return keymap.of(specs.map((spec) => {
        return {
            key: spec.key,
            preventDefault: true,
            run: (view) => {
                HEYNOTE_COMMANDS[spec.command](editor)(view)
                return true
            },
        }
    }))
}

const cmd = (key, run) => ({key, run})

export const DEFAULT_KEYMAP = [
    cmd("Mod-Enter", "addNewBlockAfterCurrent"),
    cmd("Mod-Shift-Enter", "addNewBlockAfterLast"),
    cmd("Alt-Enter", "addNewBlockBeforeCurrent"),
    cmd("Alt-Shift-Enter", "addNewBlockBeforeFirst"),
]


export function heynoteKeymap(editor, keymapSpec) {
    console.log("heynoteKeymap:", editor, keymapSpec)
    return [
        Prec.highest(keymapFromSpec(keymapSpec, editor)),
        //Prec.highest(keymap.of([{
        //    key: "Ctrl-b",
        //    run: () => {
        //        console.log("C-B", arguments)
        //        return true
        //    },
        //}])),
        keymapFromSpecOld([
            ["Mod-c", copyCommand(editor)],
            ["Mod-v", pasteCommand],
            ["Mod-x", cutCommand(editor)],
            ["Tab", indentMore],
            ["Shift-Tab", indentLess],
            //["Alt-Shift-Enter", addNewBlockBeforeFirst(editor)],
            //["Mod-Shift-Enter", addNewBlockAfterLast(editor)],
            //["Alt-Enter", addNewBlockBeforeCurrent(editor)],
            //["Mod-Enter", addNewBlockAfterCurrent(editor)],
            ["Mod-Alt-Enter", insertNewBlockAtCursor(editor)],
            ["Mod-a", selectAll],
            ["Alt-ArrowUp", moveLineUp],
            ["Alt-ArrowDown", moveLineDown],
            ["Mod-l", () => editor.openLanguageSelector()],
            ["Mod-p", () => editor.openBufferSelector()],
            ["Mod-s", () => editor.openMoveToBufferSelector()],
            ["Mod-n", () => editor.openCreateBuffer("new")],
            ["Mod-Shift-d", deleteBlock(editor)],
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
    ]
}

import { EditorView, keymap } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"
import { indentWithTab, insertTab, indentLess, indentMore, undo, redo } from "@codemirror/commands"
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

export function heynoteKeymap(editor) {
    return keymap.of([
        ["Tab", indentMore],
        ["Shift-Tab", indentLess],
        ["Mod-Enter", addNewBlockAfterCurrent],
        ["Mod-Shift-Enter", insertNewBlockAtCursor],
        ["Mod-a", selectAll],
        ["Alt-ArrowUp", moveLineUp],
        ["Alt-ArrowDown", moveLineDown],
        ["Mod-ArrowUp", gotoPreviousBlock],
        ["Mod-ArrowDown", gotoNextBlock],
        ["Mod-Shift-ArrowUp", selectPreviousBlock],
        ["Mod-Shift-ArrowDown", selectNextBlock],
        ["Ctrl-ArrowUp", gotoPreviousParagraph],
        ["Ctrl-ArrowDown", gotoNextParagraph],
        ["Ctrl-Shift-ArrowUp", selectPreviousParagraph],
        ["Ctrl-Shift-ArrowDown", selectNextParagraph],
        ["Mod-l", () => editor.openLanguageSelector()],
    ].map(([key, run]) => {
        return {
            key,
            run,
            preventDefault: true,
        }
    }))
}

export function emacsKeymap(editor) {
    return [
        heynoteKeymap(editor),
        keymap.of([
            ["Ctrl-Shift--", undo],
            ["Ctrl-.", redo],
        ].map(([key, run]) => {
            return {
                key,
                run,
                preventDefault: true,
            }
        })),
    ]
}

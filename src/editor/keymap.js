import { EditorView, keymap } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"
import { indentWithTab, insertTab, indentLess, indentMore, undo, redo } from "@codemirror/commands"
import { insertNewBlockAtCursor, addNewBlockAfterCurrent, moveLineUp, selectAll, gotoPreviousBlock, gotoNextBlock } from "./block/commands.js";

export function heynoteKeymap(editor) {
    return keymap.of([
        ["Tab", indentMore],
        ["Shift-Tab", indentLess],
        ["Mod-Enter", addNewBlockAfterCurrent],
        ["Mod-Shift-Enter", insertNewBlockAtCursor],
        ["Mod-a", selectAll],
        ["Alt-ArrowUp", moveLineUp],
        ["Mod-ArrowUp", gotoPreviousBlock],
        ["Mod-ArrowDown", gotoNextBlock],
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

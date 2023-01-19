import { keymap } from "@codemirror/view"
import { indentWithTab, insertTab, indentLess, indentMore } from "@codemirror/commands"
import { insertNewBlockAtCursor, addNewBlockAfterCurrent, moveLineUp, selectAll, gotoPreviousBlock, gotoNextBlock } from "./block/commands.js";

export function heynoteKeymap(editor) {
    return keymap.of([
        {
            key: "Tab",
            preventDefault: true,
            //run: insertTab,
            run: indentMore,
        },
        {
            key: 'Shift-Tab',
            preventDefault: true,
            run: indentLess,
        },
        {
            key: "Mod-Enter",
            preventDefault: true,
            run: addNewBlockAfterCurrent,
        },
        {
            key: "Mod-Shift-Enter",
            preventDefault: true,
            run: insertNewBlockAtCursor,
        },
        {
            key: "Mod-a",
            preventDefault: true,
            run: selectAll,
        },
        {
            key: "Alt-ArrowUp",
            preventDefault: true,
            run: moveLineUp,
        },
        {
            key: "Mod-ArrowUp",
            preventDefault: true,
            run: gotoPreviousBlock,
        },
        {
            key: "Mod-ArrowDown",
            preventDefault: true,
            run: gotoNextBlock,
        },
        {
            key: "Mod-l",
            preventDefault: true,
            run: () => editor.openLanguageSelector(),
        },
    ])
}
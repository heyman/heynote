import { keymap } from "@codemirror/view"
import { indentWithTab, insertTab, indentLess, indentMore } from "@codemirror/commands"
import { insertNewNote, moveLineUp, selectAll, gotoPreviousBlock, gotoNextBlock } from "./block/commands.js";

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
            run: insertNewNote,
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
        }
    ])
}
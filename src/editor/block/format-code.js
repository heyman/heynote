import { EditorSelection } from "@codemirror/state"

import * as prettier from "prettier/standalone"
import { getActiveNoteBlock } from "./block.js"
import { getLanguage } from "../languages.js"


export const formatBlockContent = async ({ state, dispatch }) => {
    if (state.readOnly)
        return false
    const block = getActiveNoteBlock(state)

    const language = getLanguage(block.language.name)
    if (!language.prettier) {
        return false
    }
    
    // get current cursor position
    const cursorPos = state.selection.asSingle().ranges[0].head
    // get block content
    const content = state.sliceDoc(block.content.from, block.content.to)

    //console.log("prettier supports:", getSupportInfo())

    // There is a performance bug in prettier causing formatWithCursor() to be extremely slow in some cases (https://github.com/prettier/prettier/issues/4801)
    // To work around this we use format() when the cursor is in the beginning or the end of the block.
    // This is not a perfect solution, and once the following PR is merged and released, we should be abe to remove this workaround:
    // https://github.com/prettier/prettier/pull/15709
    let useFormat = false
    if (cursorPos == block.content.from || cursorPos == block.content.to) {
        useFormat = true
    }

    let formattedContent
    try {
        if (useFormat) {
            formattedContent = {
                formatted: await prettier.format(content, {
                    parser: language.prettier.parser,
                    plugins: language.prettier.plugins,
                    tabWidth: state.tabSize,
                }),
            }
            formattedContent.cursorOffset = cursorPos == block.content.from ? 0 : formattedContent.formatted.length
        } else {
            formattedContent = await prettier.formatWithCursor(content, {
                cursorOffset: cursorPos - block.content.from,
                parser: language.prettier.parser,
                plugins: language.prettier.plugins,
                tabWidth: state.tabSize,
            })
        }
    } catch (e) {
        const hyphens = "----------------------------------------------------------------------------"
        console.log(`Error when trying to format block:\n${hyphens}\n${e.message}\n${hyphens}`)
        return false
    }
    
    dispatch(state.update({
        changes: {
            from: block.content.from,
            to: block.content.to,
            insert: formattedContent.formatted,
        },
        selection: EditorSelection.cursor(block.content.from + Math.min(formattedContent.cursorOffset, formattedContent.formatted.length)),
    }, {
        userEvent: "input",
        scrollIntoView: true,
    }))
    return true;
}


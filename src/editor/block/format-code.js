import { EditorSelection } from "@codemirror/state"

import * as prettier from "prettier/standalone"
import babelParser from "prettier/plugins/babel.mjs"
import htmlParser from "prettier/esm/parser-html.mjs"
import cssParser from "prettier/esm/parser-postcss.mjs"
import markdownParser from "prettier/esm/parser-markdown.mjs"
import * as prettierPluginEstree from "prettier/plugins/estree.mjs";

import { getActiveNoteBlock } from "./block.js"


const PARSER_MAP = {
    "json": {parser:"json-stringify", plugins: [babelParser, prettierPluginEstree]},
    "javascript": {parser:"babel", plugins: [babelParser, prettierPluginEstree]},
    "html": {parser:"html", plugins: [htmlParser]},
    "css": {parser:"css", plugins: [cssParser]},
    "markdown": {parser:"markdown", plugins: [markdownParser]},
}


export const formatBlockContent = async ({ state, dispatch }) => {
    if (state.readOnly)
        return false
    const block = getActiveNoteBlock(state)

    const langName = block.language.name
    if (!(langName in PARSER_MAP))
        return false
    
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
                    parser: PARSER_MAP[langName].parser,
                    plugins: PARSER_MAP[langName].plugins,
                    tabWidth: state.tabSize,
                }),
                cursorOffset: cursorPos == block.content.from ? 0 : content.length,
            }
        } else {
            formattedContent = await prettier.formatWithCursor(content, {
                cursorOffset: cursorPos - block.content.from,
                parser: PARSER_MAP[langName].parser,
                plugins: PARSER_MAP[langName].plugins,
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
        selection: EditorSelection.cursor(block.content.from + formattedContent.cursorOffset),
    }, {
        userEvent: "input",
        scrollIntoView: true,
    }))
    return true;
}


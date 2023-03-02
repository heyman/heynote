import { EditorSelection } from "@codemirror/state"

import { formatWithCursor, getSupportInfo } from "prettier"
import babelParser from "prettier/esm/parser-babel.mjs"
import htmlParser from "prettier/esm/parser-html.mjs"
import cssParser from "prettier/esm/parser-postcss.mjs"
import markdownParser from "prettier/esm/parser-markdown.mjs"

import { getActiveNoteBlock } from "./block.js"


const PARSER_MAP = {
    "json": {parser:"json-stringify", plugins: [babelParser]},
    "javascript": {parser:"babel", plugins: [babelParser]},
    "html": {parser:"html", plugins: [htmlParser]},
    "css": {parser:"css", plugins: [cssParser]},
    "markdown": {parser:"markdown", plugins: [markdownParser]},
}


export const formatBlockContent = ({ state, dispatch }) => {
    if (state.readOnly)
        return false
    const block = getActiveNoteBlock(state)

    const langName = block.language.name
    if (!(langName in PARSER_MAP))
        return false
    
    // get current cursor position
    const cursorPos = state.selection.asSingle().ranges[0].to
    // get block content
    const content = state.sliceDoc(block.content.from, block.content.to)

    //console.log("prettier supports:", getSupportInfo())
    const formattedContent = formatWithCursor(content, {
        cursorOffset: cursorPos - block.content.from,
        parser: PARSER_MAP[langName].parser,
        plugins: PARSER_MAP[langName].plugins,
        tabWidth: state.tabSize,
    })
    
    dispatch(state.update({
        changes: {
            from: block.content.from,
            to: block.content.to,
            insert: formattedContent.formatted,
        },
        selection: EditorSelection.cursor(block.content.from + formattedContent.cursorOffset)
    }, {
        userEvent: "input",
    }))
    return true;
}


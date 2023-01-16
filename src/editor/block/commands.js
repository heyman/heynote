import { EditorView } from "@codemirror/view"
import { 
    selectAll as defaultSelectAll, 
    moveLineUp as defaultMoveLineUp,
} from "@codemirror/commands"
import { heynoteEvent, LANGUAGE_CHANGE } from "../annotation.js";
import { HIGHLIGHTJS_TO_TOKEN } from "../languages"
import { blockState, getActiveNoteBlock } from "./block"
import { levenshtein_distance } from "../language-detection/levenshtein"


export const insertNewNote = ({ state, dispatch }) => {
    if (state.readOnly)
        return false

    const delimText = "\n∞∞∞text-a\n"
    dispatch(state.replaceSelection(delimText), 
        {
            scrollIntoView: true, 
            userEvent: "input",
        }
    )

    return true;
}

export const selectAll = ({ state, dispatch }) => {
    const range = state.selection.asSingle().ranges[0]
    const block = getActiveNoteBlock(state)

    // check if all the text of the note is already selected, in which case we want to select all the text of the whole document
    if (range.from === block.content.from && range.to === block.content.to) {
        return defaultSelectAll({state, dispatch})
    }

    dispatch(state.update({
        selection: {anchor: block.content.from, head: block.content.to}, 
        userEvent: "select"
    }))

    return true
}

/**
 * Prevent moveLineUp from executing if any cursor is on the first line of the first note
 */
export function moveLineUp({ state, dispatch }) {
    if (state.selection.ranges.some(range => {
        let startLine = state.doc.lineAt(range.from)
        return startLine.from <= state.facet(blockState)[0].content.from
    })) {
        return true;
    }
    return defaultMoveLineUp({state, dispatch})
}


export function changeLanguageTo(state, dispatch, block, language, auto) {
    const delimRegex = /^\n∞∞∞[a-z]{0,16}(-a)?\n/g
    if (state.doc.sliceString(block.delimiter.from, block.delimiter.to).match(delimRegex)) {
        //console.log("changing language to", language)
        dispatch(state.update({
            changes: {
                from: block.delimiter.from,
                to: block.delimiter.to,
                insert: `\n∞∞∞${language}${auto ? '-a' : ''}\n`,
            },
            annotations: [heynoteEvent.of(LANGUAGE_CHANGE)],
        }))
    } else {
        throw new Error("Invalid delimiter: " + state.doc.sliceString(block.delimiter.from, block.delimiter.to))
    }
}


export function autoDetectLanguage({ state, dispatch }) {
    console.log("state:", state)
    const block = getActiveNoteBlock(state)

    //console.log("content:", state.doc.sliceString(block.content.from, block.content.to))
    //console.log("langs:", hljs.listLanguages())

    let startTime = new Date();
    const result = hljs.highlightAuto(state.doc.sliceString(block.content.from, block.content.to), ["json", "python", "javascript", "html", "sql", "java", "plaintext"])
    console.log("took:", new Date() - startTime)
    console.log("highlight.js result", result)
    if (result.language) {
        changeLanguageTo(state, dispatch, block, HIGHLIGHTJS_TO_TOKEN[result.language], true)
    }
}


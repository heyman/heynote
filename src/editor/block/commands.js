import { EditorView } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"
import { 
    selectAll as defaultSelectAll, 
    moveLineUp as defaultMoveLineUp,
} from "@codemirror/commands"
import { heynoteEvent, LANGUAGE_CHANGE } from "../annotation.js";
import { blockState, getActiveNoteBlock, getNoteBlockFromPos } from "./block"
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
    if (state.readOnly)
        return false
    if (state.selection.ranges.some(range => {
        let startLine = state.doc.lineAt(range.from)
        return startLine.from <= state.facet(blockState)[0].content.from
    })) {
        return true;
    }
    return defaultMoveLineUp({state, dispatch})
}


export function changeLanguageTo(state, dispatch, block, language, auto) {
    if (state.readOnly)
        return false
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

export function changeCurrentBlockLanguage(state, dispatch, language, auto) {
    const block = getActiveNoteBlock(state)
    changeLanguageTo(state, dispatch, block, language, auto)
}

export function gotoPreviousBlock({state, dispatch}) {
    const blocks = state.facet(blockState)
    const newSelection = EditorSelection.create(state.selection.ranges.map(sel => {
        const block = getNoteBlockFromPos(state, sel.head)
        if (sel.head === block.content.from) {
            const index = blocks.indexOf(block)
            const previousBlockIndex = index > 0 ? index - 1 : 0
            return EditorSelection.cursor(blocks[previousBlockIndex].content.from)
        } else {
            return EditorSelection.cursor(block.content.from)
        }
    }), state.selection.mainIndex)
    dispatch(state.update({
        selection: newSelection,
        scrollIntoView: true,
    }))
    return true
}

export function gotoNextBlock({state, dispatch}) {
    const blocks = state.facet(blockState)
    const newSelection = EditorSelection.create(state.selection.ranges.map(sel => {
        const block = getNoteBlockFromPos(state, sel.head)
        if (sel.head === block.content.to) {
            const index = blocks.indexOf(block)
            const previousBlockIndex = index < blocks.length - 1 ? index + 1 : index
            return EditorSelection.cursor(blocks[previousBlockIndex].content.to)
        } else {
            return EditorSelection.cursor(block.content.to)
        }
    }), state.selection.mainIndex)
    dispatch(state.update({
        selection: newSelection,
        scrollIntoView: true,
    }))
    return true
}


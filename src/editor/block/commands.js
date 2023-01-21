import { EditorView } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"
import { 
    selectAll as defaultSelectAll, 
    moveLineUp as defaultMoveLineUp,
} from "@codemirror/commands"
import { heynoteEvent, LANGUAGE_CHANGE } from "../annotation.js";
import { blockState, getActiveNoteBlock, getNoteBlockFromPos } from "./block"
import { levenshtein_distance } from "../language-detection/levenshtein"
import { moveLineDown, moveLineUp } from "./move-lines.js";

export { moveLineDown, moveLineUp }


export const insertNewBlockAtCursor = ({ state, dispatch }) => {
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

export const addNewBlockAfterCurrent = ({ state, dispatch }) => {
    if (state.readOnly)
        return false
    const block = getActiveNoteBlock(state)
    const delimText = "\n∞∞∞text-a\n"

    dispatch(state.update({
        changes: {
            from: block.content.to,
            insert: delimText,
        },
        selection: EditorSelection.cursor(block.content.to + delimText.length)
    }, {
        scrollIntoView: true, 
        userEvent: "input",
    }))
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

export function gotoPreviousParagraph({state, dispatch}) {
    const blocks = state.facet(blockState)
    const newSelection = EditorSelection.create(state.selection.ranges.map(sel => {
        let block = getNoteBlockFromPos(state, sel.head)
        const blockIndex = blocks.indexOf(block)

        let seenContentLine = false
        let pos
        // if we're on the first row of a block, and it's not the first block, we start from the end of the previous block
        if (state.doc.lineAt(sel.head).from === block.content.from && blockIndex > 0) {
            block = blocks[blockIndex - 1]
            pos = state.doc.lineAt(block.content.to).from
        } else {
            pos = state.doc.lineAt(sel.head).from
        }

        while (pos > block.content.from) {
            const line = state.doc.lineAt(pos)
            if (line.text.replace(/\s/g, '').length == 0) {
                if (seenContentLine) {
                    return EditorSelection.cursor(line.from)
                }
            } else {
                seenContentLine = true
            }
            // set position to beginning go previous line
            pos = state.doc.lineAt(line.from - 1).from
        }
        return EditorSelection.cursor(block.content.from)
    }), state.selection.mainIndex)
    dispatch(state.update({
        selection: newSelection,
        scrollIntoView: true,
    }))
    return true
}

export function gotoNextParagraph({state, dispatch}) {
    const blocks = state.facet(blockState)
    const newSelection = EditorSelection.create(state.selection.ranges.map(sel => {
        let block = getNoteBlockFromPos(state, sel.head)
        const blockIndex = blocks.indexOf(block)

        let seenContentLine = false
        let pos
        // if we're at the last line of a block, and it's not the last block, we start from the beginning of the next block
        if (state.doc.lineAt(sel.head).to === block.content.to && blockIndex < blocks.length - 1) {
            block = blocks[blockIndex + 1]
            pos = state.doc.lineAt(block.content.from).to
        } else {
            pos = state.doc.lineAt(sel.head).to
        }

        while (pos < block.content.to) {
            const line = state.doc.lineAt(pos)
            if (line.text.replace(/\s/g, '').length == 0) {
                if (seenContentLine) {
                    return EditorSelection.cursor(line.from)
                }
            } else {
                seenContentLine = true
            }
            // set position to beginning go previous line
            pos = state.doc.lineAt(line.to + 1).to
        }
        return EditorSelection.cursor(block.content.to)
    }), state.selection.mainIndex)
    dispatch(state.update({
        selection: newSelection,
        scrollIntoView: true,
    }))
    return true
}

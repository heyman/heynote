import { EditorView } from "@codemirror/view"
import { 
    selectAll as defaultSelectAll, 
    moveLineUp as defaultMoveLineUp,
} from "@codemirror/commands"
import { blockState } from "./note-block"


export const insertNewNote = ({ state, dispatch }) => {
    if (state.readOnly)
        return false

    const delimText = "\n∞∞∞text\n"
    dispatch(state.replaceSelection(delimText), 
        {
            scrollIntoView: true, 
            userEvent: "input",
        }
    )

    return true;
}

export const selectAll = ({ state, dispatch }) => {
    // find which block the cursor is in
    const range = state.selection.asSingle().ranges[0]
    const block = state.facet(blockState).find(block => block.content.from <= range.from && block.content.to >= range.from)

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

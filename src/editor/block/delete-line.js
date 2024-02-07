import { EditorSelection } from "@codemirror/state"
import { getActiveNoteBlock } from "./block"

function updateSel(sel, by) {
    return EditorSelection.create(sel.ranges.map(by), sel.mainIndex);
}

function selectedLineBlocks(state) {
    let blocks = [], upto = -1
    for (let range of state.selection.ranges) {
        let startLine = state.doc.lineAt(range.from), endLine = state.doc.lineAt(range.to)
        if (!range.empty && range.to == endLine.from) endLine = state.doc.lineAt(range.to - 1)
        if (upto >= startLine.number) {
            let prev = blocks[blocks.length - 1]
            prev.to = endLine.to
            prev.ranges.push(range)
        } else {
            blocks.push({ from: startLine.from, to: endLine.to, ranges: [range] })
        }
        upto = endLine.number + 1
    }
    return blocks
}

export const deleteLine = (view) => {
    if (view.state.readOnly)
        return false

    const { state } = view

    const block = getActiveNoteBlock(view.state)
    const selectedLines = selectedLineBlocks(state)

    const changes = state.changes(selectedLines.map(({ from, to }) => {
        if(from !== block.content.from || to !== block.content.to) {
            if (from > 0) from--
            else if (to < state.doc.length) to++
        }
        return { from, to }
    }))

    const selection = updateSel(state.selection, range => view.moveVertically(range, true)).map(changes)
    view.dispatch({ changes, selection, scrollIntoView: true, userEvent: "delete.line" })

    return true;
}
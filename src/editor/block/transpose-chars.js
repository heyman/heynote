import { EditorSelection, findClusterBreak} from "@codemirror/state";

import { getNoteBlockFromPos } from "./block"

/**
Flip the characters before and after the cursor(s).
*/
export const transposeChars = ({ state, dispatch }) => {
    if (state.readOnly)
        return false;
    let changes = state.changeByRange(range => {
        // prevent transposing characters if we're at the start or end of a block, since it'll break the block syntax
        const block = getNoteBlockFromPos(state, range.from)
        if (range.from === block.content.from || range.from === block.content.to) {
            return { range }
        }

        if (!range.empty || range.from == 0 || range.from == state.doc.length)
            return { range };
        let pos = range.from, line = state.doc.lineAt(pos);
        let from = pos == line.from ? pos - 1 : findClusterBreak(line.text, pos - line.from, false) + line.from;
        let to = pos == line.to ? pos + 1 : findClusterBreak(line.text, pos - line.from, true) + line.from;
        return { changes: { from, to, insert: state.doc.slice(pos, to).append(state.doc.slice(from, pos)) },
            range: EditorSelection.cursor(to) };
    });
    if (changes.changes.empty)
        return false;
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "move.character" }));
    return true;
};

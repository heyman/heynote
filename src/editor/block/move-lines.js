import { EditorSelection } from "@codemirror/state"
import { blockState } from "./block"
import { LANGUAGES } from '../languages.js';

const languageTokensMatcher = LANGUAGES.map(l => l.token).join("|")
const tokenRegEx = new RegExp(`^∞∞∞(${languageTokensMatcher})(-a)?$`, "g")


function selectedLineBlocks(state) {
    let blocks = [], upto = -1;
    for (let range of state.selection.ranges) {
        let startLine = state.doc.lineAt(range.from), endLine = state.doc.lineAt(range.to);
        if (!range.empty && range.to == endLine.from)
            endLine = state.doc.lineAt(range.to - 1);
        if (upto >= startLine.number) {
            let prev = blocks[blocks.length - 1];
            prev.to = endLine.to;
            prev.ranges.push(range);
        }
        else {
            blocks.push({ from: startLine.from, to: endLine.to, ranges: [range] });
        }
        upto = endLine.number + 1;
    }
    return blocks;
}

function moveLine(state, dispatch, forward) {
    if (state.readOnly)
        return false;
    let changes = [], ranges = [];
    for (let block of selectedLineBlocks(state)) {
        if (forward ? block.to == state.doc.length : block.from == 0)
            continue;
        let nextLine = state.doc.lineAt(forward ? block.to + 1 : block.from - 1);
        let previousLine
        if (!forward ? block.to == state.doc.length : block.from == 0) {
            previousLine = null
        } else {
            previousLine = state.doc.lineAt(forward ? block.from - 1 : block.to + 1)
        }
        // if the whole selection is a block (surrounded by separators) we need to add an extra line break between the separators that'll
        // get stacked on top of each other, since we'll otherwise create two separators with only a single line break between them which 
        // the syntax parser won't be able to parse (since a valid separator needs one line break on each side)
        let nextLineIsSeparator = nextLine.text.match(tokenRegEx)
        let blockSurroundedBySeparators = previousLine !== null && previousLine.text.match(tokenRegEx) && nextLineIsSeparator
        let size = nextLine.length + 1;
        if (forward) {
            if (blockSurroundedBySeparators) {
                size += 1
                changes.push({ from: block.to, to: nextLine.to }, { from: block.from, insert: state.lineBreak + nextLine.text + state.lineBreak });
            } else {
                changes.push({ from: block.to, to: nextLine.to }, { from: block.from, insert: nextLine.text + state.lineBreak });
            }
            for (let r of block.ranges)
                ranges.push(EditorSelection.range(Math.min(state.doc.length, r.anchor + size), Math.min(state.doc.length, r.head + size)));
        }
        else {
            if (blockSurroundedBySeparators || (previousLine === null && nextLineIsSeparator)) {
                //size += 1
                changes.push({ from: nextLine.from, to: block.from }, { from: block.to, insert: state.lineBreak + nextLine.text + state.lineBreak});
                for (let r of block.ranges)
                    ranges.push(EditorSelection.range(r.anchor - size, r.head - size));
            } else {
                changes.push({ from: nextLine.from, to: block.from }, { from: block.to, insert: state.lineBreak + nextLine.text });
                for (let r of block.ranges)
                    ranges.push(EditorSelection.range(r.anchor - size, r.head - size));
            }
        }
    }
    if (!changes.length)
        return false;
    dispatch(state.update({
        changes,
        scrollIntoView: true,
        selection: EditorSelection.create(ranges, state.selection.mainIndex),
        userEvent: "move.line"
    }));
    return true;
}

/**
Move the selected lines up one line.
*/
export const moveLineUp = ({ state, dispatch }) => {
    // prevent moving lines up before the first block separator
    if (state.selection.ranges.some(range => {
        let startLine = state.doc.lineAt(range.from)
        return startLine.from <= state.facet(blockState)[0].content.from
    })) {
        return true;
    }
    
    return moveLine(state, dispatch, false)
}

/**
Move the selected lines down one line.
*/
export const moveLineDown = ({ state, dispatch }) => moveLine(state, dispatch, true);

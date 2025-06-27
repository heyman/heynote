import { codeFolding, foldGutter, unfoldEffect, foldEffect, foldedRanges } from "@codemirror/language"
import { EditorView } from "@codemirror/view"

import { FOLD_LABEL_LENGTH } from "@/src/common/constants.js"
import { getNoteBlockFromPos, getNoteBlocksFromRangeSet } from "./block/block.js"
import { transactionsHasAnnotation, ADD_NEW_BLOCK, transactionsHasHistoryEvent } from "./annotation.js"


// This extension fixes so that a folded region is automatically unfolded if any changes happen 
// on either the start line or the end line of the folded region (even if the change is not within the folded region)
// except for if the change is an insertion of a new block, or if the change doesn't actually insert anything.
// 
// The purpose is to prevent extra characters to be inserted into a line that is folded, without the region
// being unfolded.
const autoUnfoldOnEdit = () => {
    return EditorView.updateListener.of((update) => {
        if (!update.docChanged){
            return
        }

        const { state, view } = update;
        const foldRanges = foldedRanges(state, false)

        if (!foldRanges || foldRanges.size === 0) {
            return
        }
        
        // we don't want to unfold a block/range if the user adds a new block
        if (transactionsHasAnnotation(update.transactions, ADD_NEW_BLOCK)) {
            return
        }
        // an undo/redo action should never be able to get characters into a folded line but if we don't have 
        // this check an undo/redo of a block insertion before/after the region will unfold the folded block
        if (transactionsHasHistoryEvent(update.transactions)) {
            return
        }

        // This fixes so that removing the previous block immediately after a folded block won't unfold the folded block
        // Since nothing was inserted, there is no risk of us putting extra characters into folded lines
        // Commented out, because it DOES NOT WORK, since it allows removing characters within the folded region, without unfolding it
        //if (update.changes.inserted.length === 0) {
        //    return
        //}

        const unfoldRanges = []

        update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            foldRanges.between(0, state.doc.length, (from, to) => {
                const lineFrom = state.doc.lineAt(from).from
                const lineTo = state.doc.lineAt(to).to;

                //console.log("lineFrom:", lineFrom, "lineTo:", lineTo, "fromA:", fromA, "toA:", toA, "fromB:", fromB, "toB:", toB);

                if ((fromB >= lineFrom && fromB <= lineTo) || (toB >= lineFrom && toB <= lineTo)) {
                    unfoldRanges.push({ from, to });
                }
            });
        });

        //console.log("Unfold ranges:", unfoldRanges);
        if (unfoldRanges.length > 0) {
            view.dispatch({
                effects: unfoldRanges.map(range => unfoldEffect.of(range)),
            });
        }
    })
}

export function foldGutterExtension() {
    return [
        foldGutter({
            domEventHandlers: {
                click(view, line, event) {
                    // editor should not loose focus when clicking on the fold gutter
                    view.docView.dom.focus()
                },
            },
        }),
        codeFolding(
            {
                //placeholderText: "⯈ Folded",
                preparePlaceholder: (state, {from, to}) => {
                    // Count the number of lines in the folded range
                    const firstLine = state.doc.lineAt(from)
                    const lineFrom = firstLine.number
                    const lineTo = state.doc.lineAt(to).number
                    const lineCount = lineTo - lineFrom + 1

                    const label = firstLine.text
                    //console.log("label", label, "line", firstLine)
                    const labelDom = document.createElement("span")
                    labelDom.textContent = label.slice(0, 100)

                    const linesDom = document.createElement("span")
                    linesDom.textContent = `${label.slice(-1).trim() === "" ? '' : ' '}… (${lineCount} lines)`
                    linesDom.style.fontStyle = "italic"
                
                    const dom = document.createElement("span")
                    dom.className = "cm-foldPlaceholder"
                    dom.style.opacity = "0.6"
                    if (firstLine.from === from) {
                        dom.appendChild(labelDom)
                    }
                    dom.appendChild(linesDom)
                    return dom
                },
                placeholderDOM: (view, onClick, prepared) => {
                    prepared.addEventListener("click", onClick)
                    return prepared
                }
            }
        ),
        autoUnfoldOnEdit(),
    ]
}


export const toggleBlockFold = (editor) => (view) => {
    const state = view.state
    const folds = foldedRanges(state)

    const foldEffects = []
    const unfoldEffects = []
    let numFolded = 0, numUnfolded = 0

    for (const block of getNoteBlocksFromRangeSet(state, state.selection.ranges)) {
        const firstLine = state.doc.lineAt(block.content.from)
        let blockIsFolded = false
        const blockFolds = []
        folds.between(block.content.from, block.content.to, (from, to) => {
            if (from <= firstLine.to && to === block.content.to) {
                blockIsFolded = true
                blockFolds.push({from, to})
            }
        })
        if (blockIsFolded) {
            unfoldEffects.push(...blockFolds.map(range => unfoldEffect.of(range)))
            numFolded++
        } else {
            const range = {from: Math.min(firstLine.to, block.content.from + FOLD_LABEL_LENGTH), to: block.content.to}
            if (range.to > range.from) {
                foldEffects.push(foldEffect.of(range))
            }
            numUnfolded++
        }
    }

    if (foldEffects.length > 0 || unfoldEffects.length > 0) {
        // if multiple blocks are selected, instead of flipping the fold state of all blocks,
        // we'll fold all blocks if more blocks are unfolded than folded, and unfold all blocks otherwise
        view.dispatch({
            effects: [...(numUnfolded >= numFolded ? foldEffects : unfoldEffects)],
        })
    }
}


export const foldBlock = (editor) => (view) => {
    const state = view.state    
    const blockRanges = []

    for (const block of getNoteBlocksFromRangeSet(state, state.selection.ranges)) {
        const line = state.doc.lineAt(block.content.from)
        // fold the block content, but only the first line
        const from = Math.min(line.to, block.content.from + FOLD_LABEL_LENGTH)
        const to = block.content.to
        if (from < to) {
            // skip empty ranges
            blockRanges.push({from, to})
        }
    }
    if (blockRanges.length > 0) {
        view.dispatch({
            effects: blockRanges.map(range => foldEffect.of(range)),
        })
    }
}

export const unfoldBlock = (editor) => (view) => {
    const state = view.state
    const folds = foldedRanges(state)
    const blockFolds = []

    for (const block of getNoteBlocksFromRangeSet(state, state.selection.ranges)) {
        const firstLine = state.doc.lineAt(block.content.from)
        folds.between(block.content.from, block.content.to, (from, to) => {
            if (from <= firstLine.to && to === block.content.to) {
                blockFolds.push({from, to})
            }
        })
    }

    if (blockFolds.length > 0) {
        view.dispatch({
            effects: blockFolds.map(range => unfoldEffect.of(range)),
        })
    }
}

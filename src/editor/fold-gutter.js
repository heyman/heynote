import { codeFolding, foldGutter, foldState, unfoldEffect, foldEffect } from "@codemirror/language"
import { EditorView } from "@codemirror/view"
import { RangeSet } from "@codemirror/state"

import { FOLD_LABEL_LENGTH } from "@/src/common/constants.js"
import { getNoteBlockFromPos } from "./block/block.js"


// This extension fixes so that a folded region is automatically unfolded if any changes happen 
// on either the start line or the end line of the folded region (even if the change is not within the folded region)
const autoUnfoldOnEdit = () => {
    return EditorView.updateListener.of((update) => {
        if (!update.docChanged){
            return
        }

        const { state, view } = update;
        const foldRanges = state.field(foldState, false);

        if (!foldRanges || foldRanges.size === 0) {
            return
        }

        const unfoldRanges = []

        update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            foldRanges.between(0, state.doc.length, (from, to) => {
                const lineFrom = state.doc.lineAt(from).from
                const lineTo = state.doc.lineAt(to).to;

                if ((fromA >= lineFrom && fromA <= lineTo) || (toA >= lineFrom && toA <= lineTo)) {
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
    const folds = state.field(foldState, false) || RangeSet.empty
    const effects = []

    state.selection.ranges.map(range => range.head).forEach((pos) => {
        const block = getNoteBlockFromPos(state, pos)
        const firstLine = state.doc.lineAt(block.content.from)
        const blockFolds = []
        folds.between(block.content.from, block.content.to, (from, to) => {
            if (from <= firstLine.to && to === block.content.to) {
                blockFolds.push({from, to})
            }
        })
        if (blockFolds.length > 0) {
            for (const range of blockFolds) {
                // If there are folds in the block, unfold them
                effects.push(unfoldEffect.of(range))
            }
        } else {
            // If there are no folds in the block, fold it
            const line = state.doc.lineAt(block.content.from)
            effects.push(foldEffect.of({from: Math.min(line.to, block.content.from + FOLD_LABEL_LENGTH), to: block.content.to}))
        }
    })

    if (effects.length > 0) {
        view.dispatch({
            effects: effects,
        })
    }
}


export const foldBlock = (editor) => (view) => {
    const state = view.state    
    const blockRanges = []
    state.selection.ranges.map(range => range.head).forEach((pos) => {
        const block = getNoteBlockFromPos(state, pos)
        if (block) {
            const line = state.doc.lineAt(block.content.from)
            blockRanges.push({from: Math.min(line.to, block.content.from + FOLD_LABEL_LENGTH), to: block.content.to})
        }
    })
    const uniqueBlockRanges = [...new Set(blockRanges.map(JSON.stringify))].map(JSON.parse);

    if (uniqueBlockRanges.length > 0) {
        view.dispatch({
            effects: uniqueBlockRanges.map(range => foldEffect.of(range)),
        })
    }
}

export const unfoldBlock = (editor) => (view) => {
    const state = view.state
    const folds = state.field(foldState, false) || RangeSet.empty
    const blockFolds = []

    state.selection.ranges.map(range => range.head).forEach((pos) => {
        const block = getNoteBlockFromPos(state, pos)
        const firstLine = state.doc.lineAt(block.content.from)
        folds.between(block.content.from, block.content.to, (from, to) => {
            //console.log("Fold in block", from, to, "block", block.content.from, block.content.to, firstLine.to)
            if (from <= firstLine.to && to === block.content.to) {
                blockFolds.push({from, to})
            }
        })
    })

    if (blockFolds.length > 0) {
        view.dispatch({
            effects: blockFolds.map(range => unfoldEffect.of(range)),
        })
    }
}
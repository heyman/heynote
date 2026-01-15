import { ViewPlugin, EditorView, Decoration, WidgetType, lineNumbers } from "@codemirror/view"
import { layer, RectangleMarker } from "@codemirror/view"
import { EditorState, RangeSetBuilder, StateField, RangeSet, Transaction} from "@codemirror/state";
import { syntaxTreeAvailable } from "@codemirror/language"
import { useHeynoteStore } from "../../stores/heynote-store.js"
import { heynoteEvent, LANGUAGE_CHANGE, CURSOR_CHANGE, SET_CONTENT, UPDATE_CREATED, ADD_NEW_BLOCK } from "../annotation.js";
import { mathBlock } from "./math.js"
import { emptyBlockSelected } from "./select-all.js";
import { firstBlockDelimiterSize, getBlocksFromSyntaxTree, getBlocksFromString, getBlockDelimiter } from "./block-parsing.js";

export const delimiterRegex = /^\n∞∞∞[a-z]+(-a)?(?:;[^\\n]+)*\n$/
export const delimiterRegexWithoutNewline = /^∞∞∞[a-z]+?(-a)?(?:;[^\\n]+)*$/



/**
 * Get the blocks from the document state.
 * If the syntax tree is available, we'll extract the blocks from that. Otherwise 
 * the blocks are parsed from the string contents of the document, which is much faster
 * than waiting for the tree parsing to finish.
 */
export function getBlocks(state) {
    if (syntaxTreeAvailable(state, state.doc.length)) {
        return getBlocksFromSyntaxTree(state)
    } else {
        return getBlocksFromString(state)
    }
}

export const blockState = StateField.define({
    create(state) {
        return getBlocks(state);
    },
    update(blocks, transaction) {
        // if blocks are empty it likely means we didn't get a parsed syntax tree, and then we want to update
        // the blocks on all updates (and not just document changes)
        if (transaction.docChanged || blocks.length === 0) {
            return getBlocks(transaction.state);
        }
        return blocks
    },
})

export function getActiveNoteBlock(state) {
    // find which block the cursor is in
    const range = state.selection.asSingle().ranges[0]
    return state.facet(blockState).find(block => block.range.from <= range.head && block.range.to >= range.head)
}

export function getFirstNoteBlock(state) {
    return state.facet(blockState)[0]
}

export function getLastNoteBlock(state) {
    return state.facet(blockState)[state.facet(blockState).length - 1]
}

export function getNoteBlockFromPos(state, pos) {
    return state.facet(blockState).find(block => block.range.from <= pos && block.range.to >= pos)
}

export function getNoteBlocksBetween(state, from, to) {
    return state.facet(blockState).filter(block => block.range.from < to && block.range.to >= from)
}

export function getNoteBlocksFromRangeSet(state, ranges) {
    const blocks = []
    const seenBlockStarts = new Set()
    for (const range of ranges) {
        if (!seenBlockStarts.has(range.from)) {
            blocks.push(...getNoteBlocksBetween(state, range.from, range.to))
            seenBlockStarts.add(range.from)
        }
    }
    return blocks
}


class NoteBlockStart extends WidgetType {
    constructor(isFirst) {
        super()
        this.isFirst = isFirst
    }
    eq(other) {
        return this.isFirst === other.isFirst
    }
    toDOM() {
        let wrap = document.createElement("div")
        wrap.className = "heynote-block-start" + (this.isFirst ? " first" : "")
        //wrap.innerHTML = "<br>"
        return wrap
    }
    ignoreEvent() {
        return false
    }
}
const noteBlockWidget = () => {
    const decorate = (state) => {
        const widgets = [];

        state.facet(blockState).forEach(block => {
            let delimiter = block.delimiter
            let deco = Decoration.replace({
                widget: new NoteBlockStart(delimiter.from === 0 ? true : false),
                inclusive: true,
                block: true,
                side: 0,
            });
            //console.log("deco range:", delimiter.from === 0 ? delimiter.from : delimiter.from+1,delimiter.to-1)
            widgets.push(deco.range(
                delimiter.from === 0 ? delimiter.from : delimiter.from + 1,
                delimiter.to - 1,
            ));
        });

        return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
    };

    const noteBlockStartField = StateField.define({
        create(state) {
            return decorate(state);
        },
        update(widgets, transaction) {
            // if widgets are empty it likely means we didn't get a parsed syntax tree, and then we want to update
            // the decorations on all updates (and not just document changes)
            if (transaction.docChanged || widgets.isEmpty) {
                return decorate(transaction.state);
            }

            //return widgets.map(transaction.changes);
            return widgets
        },
        provide(field) {
            return EditorView.decorations.from(field);
        }
    });

    return noteBlockStartField;
};




function atomicRanges(view) {
    let builder = new RangeSetBuilder()
    view.state.facet(blockState).forEach(block => {
        builder.add(
            block.delimiter.from,
            block.delimiter.to,
            {},
        )
    })
    return builder.finish()
}
const atomicNoteBlock = ViewPlugin.fromClass(
    class {
        constructor(view) {
            this.atomicRanges = atomicRanges(view)
        }

        update(update) {
            if (update.docChanged) {
                this.atomicRanges = atomicRanges(update.view)
            }
        }
    },
    {
        provide: plugin => EditorView.atomicRanges.of(view => {
            return view.plugin(plugin)?.atomicRanges || []
        })
    }
)


const blockLayer = layer({
    above: false,

    markers(view) {
        const markers = []
        let idx = 0
        //console.log("visible ranges:", view.visibleRanges[0].from, view.visibleRanges[0].to, view.visibleRanges.length)
        function rangesOverlaps(range1, range2) {
            return range1.from <= range2.to && range2.from <= range1.to
        }
        const blocks = view.state.facet(blockState)
        blocks.forEach(block => {
            // make sure the block is visible
            if (!view.visibleRanges.some(range => rangesOverlaps(block.content, range))) {
                idx++;
                return
            }
            // Use line box geometry so inline widgets (like images) expand the block height.
            const fromPos = Math.max(block.content.from, view.visibleRanges[0].from)
            const toPos = Math.min(block.content.to, view.visibleRanges[view.visibleRanges.length - 1].to)
            const fromCoordsTop = view.lineBlockAt(fromPos)?.top
            const toLine = view.state.doc.lineAt(toPos)
            const toLinePos = toLine.length === 0 ? toLine.from : Math.max(fromPos, Math.min(toPos - 1, block.content.to - 1))
            let toCoordsBottom = view.lineBlockAt(toLinePos)?.bottom
            if (idx === blocks.length - 1) {
                // Calculate how much extra height we need to add to the last block
                let extraHeight = view.viewState.editorHeight - (
                    view.defaultLineHeight + // when scrolling furthest down, one line is still shown at the top
                    view.documentPadding.top +
                    11
                )
                toCoordsBottom += extraHeight
            }
            markers.push(new RectangleMarker(
                idx++ % 2 == 0 ? "block-even" : "block-odd",
                0,
                fromCoordsTop - 2,
                null, // width is set to 100% in CSS
                (toCoordsBottom - fromCoordsTop) + 15,
            ))
        })
        return markers
    },

    update(update, dom) {
        return update.docChanged || update.viewportChanged
    },

    class: "heynote-blocks-layer"
})


const preventFirstBlockFromBeingDeleted = EditorState.changeFilter.of((tr) => {
    //console.log("change filter!", tr)
    const protect = []
    if (!tr.annotations.some(a => a.type === heynoteEvent) && firstBlockDelimiterSize) {
        protect.push(0, firstBlockDelimiterSize)
    }
    // if the transaction is a search and replace, we want to protect all block delimiters
    if (tr.annotations.some(a => a.value === "input.replace" || a.value === "input.replace.all")) {
        const blocks = tr.startState.facet(blockState)
        blocks.forEach(block => {
            protect.push(block.delimiter.from, block.delimiter.to)
        })
        //console.log("protected ranges:", protect)
    }
    if (protect.length > 0) {
        return protect
    }
})

/**
 * Transaction filter to prevent the selection from being before the first block
  */
const preventSelectionBeforeFirstBlock = EditorState.transactionFilter.of((tr) => {
    if (!firstBlockDelimiterSize || tr.annotations.some(a => a.type === heynoteEvent)) {
        return tr
    }
    tr?.selection?.ranges.forEach(range => {
        // change the selection to after the first block if the transaction sets the selection before the first block
        if (range && range.from < firstBlockDelimiterSize) {
            range.from = firstBlockDelimiterSize
            //console.log("changing the from selection to", markerSize)
        }
        if (range && range.to < firstBlockDelimiterSize) {
            range.to = firstBlockDelimiterSize
            //console.log("changing the from selection to", markerSize)
        }
    })
    return tr
})

export function getBlockLineFromPos(state, pos) {
    const line = state.doc.lineAt(pos)
    const block = state.facet(blockState).find(block => block.content.from <= line.from && block.content.to >= line.from)
    if (block) {
        const firstBlockLine = state.doc.lineAt(block.content.from).number
        return {
            line: line.number - firstBlockLine + 1,
            col: pos - line.from + 1,
            length: line.length,
        }
    }
    return null
}

export const blockLineNumbers = lineNumbers({
    formatNumber(lineNo, state) {
        if (state.doc.lines >= lineNo) {
            const lineInfo = getBlockLineFromPos(state, state.doc.line(lineNo).from)
            if (lineInfo !== null) {
                return lineInfo.line
            }
        }
        return ""
    },
    domEventHandlers: {
        click(view, line, event) {
            // editor should not loose focus when clicking on the line numbers
            view.focus()
        },
    },
})


function getSelectionSize(state, sel) {
    let count = 0
    let numBlocks = 0
    for (const block of state.facet(blockState)) {
        if (sel.from <= block.range.to && sel.to > block.range.from) {
            count += Math.min(sel.to, block.content.to) - Math.max(sel.from, block.content.from)
            numBlocks++
        }
    }
    count += (numBlocks - 1) * 2 // add 2 for each block separator
    return count
}

export function triggerCursorChange({state, dispatch}) {
    // Trigger empty change transaction that is annotated with CURRENCIES_LOADED
    // This will make Math blocks re-render so that currency conversions are applied
    dispatch(state.update({
        changes:{from: 0, to: 0, insert:""},
        annotations: [heynoteEvent.of(CURSOR_CHANGE), Transaction.addToHistory.of(false)],
    }))
}

const emitCursorChange = (editor) => {
    const heynoteStore = useHeynoteStore()
    return ViewPlugin.fromClass(
        class {
            update(update) {
                // if the selection changed or the language changed (can happen without selection change), 
                // emit a selection change event
                const shouldUpdate = update.transactions.some(tr => tr.annotations.some(a => a.value == LANGUAGE_CHANGE || a.value == CURSOR_CHANGE))
                if (update.selectionSet || shouldUpdate) {
                    const cursorLine = getBlockLineFromPos(update.state, update.state.selection.main.head)

                    const selectionSize = update.state.selection.ranges.map(
                        (sel) => getSelectionSize(update.state, sel)
                    ).reduce((a, b) => a + b, 0)

                    const block = getActiveNoteBlock(update.state)
                    if (block && cursorLine) {
                        heynoteStore.currentCursorLine = cursorLine
                        heynoteStore.currentSelectionSize = selectionSize
                        heynoteStore.currentLanguage = block.language.name
                        heynoteStore.currentLanguageAuto = block.language.auto
                        heynoteStore.currentBufferName = editor.name
                        heynoteStore.currentCreatedTime = block.created ? new Date(Date.parse(block.created)) : null
                    }
                }
            }
        }
    )
}

/**
 * Transaction filter that updates the created time when content are written to empty blocks
 * (so that the created time reflects the first time the block got actual content, and no just 
 * when the block separator was added)
 */
const updateCreatedOnEmptyBlock = () => {
    return EditorState.transactionFilter.of((tr) => {
        if (!tr.docChanged || tr.startState.readOnly) {
            return tr
        }
        if (
            tr.annotation(heynoteEvent) === UPDATE_CREATED || 
            tr.annotation(heynoteEvent) === SET_CONTENT ||
            tr.annotation(heynoteEvent) === ADD_NEW_BLOCK
        ) {
            return tr
        }
        if (tr.isUserEvent("undo") || tr.isUserEvent("redo")) {
            return tr
        }
        const changes = []
        const now = new Date()
        const startBlocks = tr.startState.facet(blockState)
        const emptyBlocks = []

        // snapshot empty blocks from the start state; we only update timestamps on first insert.
        for (const block of startBlocks) {
            if (block.content.from === block.content.to) {
                emptyBlocks.push({
                    pos: block.content.from,
                    block,
                    touched: false,
                })
            }
        }

        if (emptyBlocks.length === 0) {
            return tr
        }

        // mark which empty block positions were touched by inserted content in this transaction.
        let emptyIdx = 0
        tr.changes.iterChanges((fromA, toA, fromB, toB) => {
            // skip changes that's just removals
            if (toB === fromB) {
                return
            }
            // skip any changes that replaces text
            if (fromA !== toA) {
                return
            }
            // skip blocks before the change
            while (emptyIdx < emptyBlocks.length && emptyBlocks[emptyIdx].pos < fromA) {
                emptyIdx++
            }
            
            let idx = emptyIdx
            while (idx < emptyBlocks.length && emptyBlocks[idx].pos <= toA) {
                emptyBlocks[idx].touched = true
                idx++
            }
        })

        // rewrite the delimiter at mapped positions to refresh the created time.
        for (const entry of emptyBlocks) {
            if (!entry.touched) {
                continue
            }
            //const delimiterText = `\n∞∞∞${entry.block.language.name}${entry.block.language.auto ? "-a" : ""};created=${now}\n`
            const delimiterText = getBlockDelimiter(entry.block.language.name, entry.block.language.auto, now)
            changes.push({
                from: tr.changes.mapPos(entry.block.delimiter.from, 1),
                to: tr.changes.mapPos(entry.block.delimiter.to, -1),
                insert: delimiterText,
            })
        }

        if (changes.length === 0) {
            return tr
        }

        return [
            tr,
            {
                changes,
                annotations: [heynoteEvent.of(UPDATE_CREATED)],
            },
        ]
    })
}

export const noteBlockExtension = (editor) => {
    return [
        blockState,
        noteBlockWidget(),
        atomicNoteBlock,
        blockLayer,
        preventFirstBlockFromBeingDeleted,
        preventSelectionBeforeFirstBlock,
        emitCursorChange(editor),
        updateCreatedOnEmptyBlock(),
        mathBlock,
        emptyBlockSelected,
    ]
}

import { ViewPlugin, EditorView, Decoration, WidgetType, lineNumbers } from "@codemirror/view"
import { layer, RectangleMarker } from "@codemirror/view"
import { EditorState, RangeSetBuilder, StateField, Facet , StateEffect, RangeSet} from "@codemirror/state";
import { syntaxTree, ensureSyntaxTree, syntaxTreeAvailable } from "@codemirror/language"
import { Note, Document, NoteDelimiter } from "../lang-heynote/parser.terms.js"
import { IterMode } from "@lezer/common";
import { heynoteEvent, LANGUAGE_CHANGE } from "../annotation.js";
import { SelectionChangeEvent } from "../event.js"
import { mathBlock } from "./math.js"
import { emptyBlockSelected } from "./select-all.js";


function startTimer() {
    const timeStart = performance.now();
    return function () {
      return Math.round(performance.now() - timeStart);
    };
}


// tracks the size of the first delimiter
let firstBlockDelimiterSize

/**
 * Return a list of blocks in the document from the syntax tree.
 * syntaxTreeAvailable() should have been called before this function to ensure the syntax tree is available.
 */
export function getBlocksFromSyntaxTree(state) {
    //const timer = startTimer()
    const blocks = [];  
    const tree = syntaxTree(state, state.doc.length)
    if (tree) {
        tree.iterate({
            enter: (type) => {
                if (type.type.id == Document || type.type.id == Note) {
                    return true
                } else if (type.type.id === NoteDelimiter) {
                    const langNode = type.node.getChild("NoteLanguage")
                    const language = state.doc.sliceString(langNode.from, langNode.to)
                    const isAuto = !!type.node.getChild("Auto")
                    const contentNode = type.node.nextSibling
                    blocks.push({
                        language: {
                            name: language,
                            auto: isAuto,
                        },
                        content: {
                            from: contentNode.from,
                            to: contentNode.to,
                        },
                        delimiter: {
                            from: type.from,
                            to: type.to,
                        },
                        range: {
                            from: type.node.from,
                            to: contentNode.to,
                        },
                    })
                    return false;
                }
                return false;
            },
            mode: IterMode.IgnoreMounts,
        });
        firstBlockDelimiterSize = blocks[0]?.delimiter.to
    }
    //console.log("getBlocksSyntaxTree took", timer(), "ms")
    return blocks
}

/**
 * Parse blocks from document's string contents using String.indexOf()
 */
export function getBlocksFromString(state) {
        //const timer = startTimer()
        const blocks = []
        const doc = state.doc
        if (doc.length === 0) {
            return [];
        }
        const content = doc.sliceString(0, doc.length)
        const delim = "\n∞∞∞"
        let pos = 0
        while (pos < doc.length) {
            const blockStart = content.indexOf(delim, pos);
            if (blockStart != pos) {
                console.error("Error parsing blocks, expected delimiter at", pos)
                break;
            }
            const langStart = blockStart + delim.length;
            const delimiterEnd = content.indexOf("\n", langStart)
            if (delimiterEnd < 0) {
                console.error("Error parsing blocks. Delimiter didn't end with newline")
                break
            }
            const langFull = content.substring(langStart, delimiterEnd);
            let auto = false;
            let lang = langFull;
            if (langFull.endsWith("-a")) {
                auto = true;
                lang = langFull.substring(0, langFull.length - 2);
            }
            const contentFrom = delimiterEnd + 1;
            let blockEnd = content.indexOf(delim, contentFrom);
            if (blockEnd < 0) {
                blockEnd = doc.length;
            }
            
            const block = {
                language: {
                    name: lang,
                    auto: auto,
                },
                content: {
                    from: contentFrom,
                    to: blockEnd,
                },
                delimiter: {
                    from: blockStart,
                    to: delimiterEnd + 1,
                },
                range: {
                    from: blockStart,
                    to: blockEnd,
                },
            };
            blocks.push(block);
            pos = blockEnd;
        }
        //console.log("getBlocksFromString() took", timer(), "ms")
        return blocks;
}

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
            const fromCoordsTop = view.coordsAtPos(Math.max(block.content.from, view.visibleRanges[0].from)).top
            let toCoordsBottom = view.coordsAtPos(Math.min(block.content.to, view.visibleRanges[view.visibleRanges.length - 1].to)).bottom
            if (idx === blocks.length - 1) {
                // Calculate how much extra height we need to add to the last block
                let extraHeight = view.viewState.editorHeight - (
                    view.defaultLineHeight + // when scrolling furthest down, one line is still shown at the top
                    view.documentPadding.top +
                    8
                )
                toCoordsBottom += extraHeight
            }
            markers.push(new RectangleMarker(
                idx++ % 2 == 0 ? "block-even" : "block-odd",
                0,
                // Change "- 0 - 6" to "+ 1 - 6" on the following line, and "+ 1 + 13" to "+2 + 13" on the line below, 
                // in order to make the block backgrounds to have no gap between them
                fromCoordsTop - (view.documentTop - view.documentPadding.top) - 1 - 6,
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
    }
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

const emitCursorChange = (editor) => ViewPlugin.fromClass(
    class {
        update(update) {
            // if the selection changed or the language changed (can happen without selection change), 
            // emit a selection change event
            const langChange = update.transactions.some(tr => tr.annotations.some(a => a.value == LANGUAGE_CHANGE))
            if (update.selectionSet || langChange) {
                const cursorLine = getBlockLineFromPos(update.state, update.state.selection.main.head)

                const selectionSize = update.state.selection.ranges.map(
                    (sel) => getSelectionSize(update.state, sel)
                ).reduce((a, b) => a + b, 0)

                const block = getActiveNoteBlock(update.state)
                if (block && cursorLine) {
                    editor.element.dispatchEvent(new SelectionChangeEvent({
                        cursorLine,
                        selectionSize,
                        language: block.language.name,
                        languageAuto: block.language.auto,
                    }))
                }
            }
        }
    }
)

export const noteBlockExtension = (editor) => {
    return [
        blockState,
        noteBlockWidget(),
        atomicNoteBlock,
        blockLayer,
        preventFirstBlockFromBeingDeleted,
        preventSelectionBeforeFirstBlock,
        emitCursorChange(editor),
        mathBlock,
        emptyBlockSelected,
    ]
}

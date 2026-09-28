import { EditorView, Decoration } from "@codemirror/view"
import { ViewPlugin } from "@codemirror/view"
import { StateField, RangeSet, RangeSetBuilder } from "@codemirror/state"
import { foldState } from "@codemirror/language"

import { transactionHasFoldEffect } from "../annotation.js"
import { DocumentWidget } from "./widget.js"
import { parseDocuments } from "./document-parsing.js"

export const documentState = StateField.define({
    create(state) {
        return parseDocuments(state)
    },
    update(docs, transaction) {
        if (transaction.docChanged) {
            return parseDocuments(transaction.state)
        }
        return docs
    },
})

function atomicRanges(view) {
    let builder = new RangeSetBuilder()
    view.state.field(documentState).forEach(doc => {
        builder.add(
            doc.from,
            doc.to,
            {},
        )
    })
    return builder.finish()
}

const atomicDocuments = ViewPlugin.fromClass(
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

export const documentExtension = () => {
    const decorate = (state) => {
        const widgets = []
        const selection = state.selection.main

        const foldStarts = new Set()
        const foldRanges = state.field(foldState, false)
        if (foldRanges) {
            foldRanges.between(0, state.doc.length, (from) => {
                foldStarts.add(from)
            })
        }

        let foundSelectedDoc = false
        state.field(documentState).forEach(doc => {
            let isFolded = foldStarts.has(doc.to)

            let isSelected = false
            if (!foundSelectedDoc && documentIsSelected(doc, selection)) {
                isSelected = true
                foundSelectedDoc = true
            }

            let deco = Decoration.replace({
                widget: new DocumentWidget({
                    id: doc.id,
                    path: doc.file,
                    name: doc.name,
                    size: doc.size,
                    selected: isSelected,
                    isFolded,
                }),
                inclusive: false,
                block: false,
                side: 0,
            })
            widgets.push(deco.range(
                doc.from,
                doc.to,
            ))
        })

        return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
    }

    const documentsField = StateField.define({
        create(state) {
            return decorate(state)
        },
        update(widgets, transaction) {
            if (transaction.docChanged || transaction.selection || transactionHasFoldEffect(transaction)) {
                return decorate(transaction.state)
            }
            return widgets
        },
        provide(field) {
            return EditorView.decorations.from(field)
        }
    })

    return [
        documentState,
        documentsField,
        atomicDocuments,
    ]
}

export const documentIsSelected = (doc, selection) => {
    return selection.from === selection.to && (selection.from === doc.from || selection.from === doc.to)
}

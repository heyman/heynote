import { EditorView, Decoration } from "@codemirror/view"
import { ViewPlugin } from "@codemirror/view"
import { EditorState, EditorSelection, SelectionRange, StateField, RangeSet, RangeSetBuilder, Compartment } from "@codemirror/state"
import { foldState } from "@codemirror/language"

import { transactionHasFoldEffect } from "../annotation.js"
import { ImageWidget } from "./widget.js"
import { parseImages } from "./image-parsing.js"


export const imageState = StateField.define({
    create(state) {
        return parseImages(state);
    },
    update(images, transaction) {
        // if blocks are empty it likely means we didn't get a parsed syntax tree, and then we want to update
        // the blocks on all updates (and not just document changes)
        if (transaction.docChanged) {
            return parseImages(transaction.state);
        }
        return images
    },
})

function atomicRanges(view) {
    let builder = new RangeSetBuilder()
    view.state.field(imageState).forEach(image => {
        builder.add(
            image.from-0,
            image.to+0,
            {},
        )
    })
    return builder.finish()
}
const atomicImages = ViewPlugin.fromClass(
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


export const imageExtension = () => {
    const domEventCompartment = new Compartment

    const decorate = (state) => {
        const widgets = []
        const selection = state.selection.main

        // Construct a Set of all the positions where a fold starts
        const foldStarts = new Set()
        state.field(foldState, false).between(0, state.doc.length, (from, _to, _value) => {
            foldStarts.add(from)
        })

        let foundSelectedImage = false
        state.field(imageState).forEach(image => {
            // If a fold starts immediately after an image, it means the image is on the first line of a folded block
            // and in this case we want to render a folded image
            let isFolded = foldStarts.has(image.to)

            let isSelected
            // only allow one image to be selected (if the cursor is placed directly between two images)
            if (!foundSelectedImage && imageIsSelected(image, selection)) {
                isSelected = true
                foundSelectedImage = true
            }
            //let delimiter = image.delimiter
            let deco = Decoration.replace({
                widget: new ImageWidget({
                    id: image.id,
                    path: image.file,
                    width: image.width,
                    height: image.height,
                    displayWidth: image.displayWidth,
                    displayHeight: image.displayHeight,
                    selected: isSelected,
                    isFolded,
                    domEventCompartment,
                }),
                inclusive: false,
                block: false,
                side: 0,
            });
            //console.log("deco range:", delimiter.from === 0 ? delimiter.from : delimiter.from+1,delimiter.to-1)
            widgets.push(deco.range(
                image.from,
                image.to,
            ));
        });

        return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
    }

    const imagesField = StateField.define({
        create(state) {
            return decorate(state);
        },
        update(widgets, transaction) {
            // if widgets are empty it likely means we didn't get a parsed syntax tree, and then we want to update
            // the decorations on all updates (and not just document changes)
            if (transaction.docChanged || transaction.selection || transactionHasFoldEffect(transaction)) {
                //console.log("updating imagesField")
                return decorate(transaction.state);
            }

            //return widgets.map(transaction.changes);
            return widgets
        },
        provide(field) {
            return EditorView.decorations.from(field);
        }
    });


    /*function widgetRangeAt(view, pos) {
        const images = view.state.field(imagesField)
        let found
    
        // Scan a tiny window around pos (replace widgets can map oddly at boundaries)
        const a = Math.max(0, pos - 1)
        const b = Math.min(view.state.doc.length, pos + 1)
    
        images.between(a, b, (from, to) => {
            // Ideally: ensure it's *your* widget (optional)
            found = { from, to }
        })
    
        return found
    }*/


    return [
        imageState,
        imagesField,
        atomicImages,
        domEventCompartment.of([])
    ]
}


export const imageIsSelected = (image, selection) => {
    //return selection.from === image.from && selection.to === image.to

    return selection.from === selection.to && (selection.from === image.from || selection.from === image.to)
    //return selection.from === selection.to && selection.from === image.to
    //return selection.from === selection.to && ((selection.assoc === 1 && selection.from === image.from) || (selection.assoc <= 0 && selection.from === image.to))

    //if (selection.main.assoc === 1) {
    //    return selection.from >= image.from && selection.to < image.to
    //} else if (selection.main.assoc{
    //    return selection.from > image.from && selection.to <= image.to
}

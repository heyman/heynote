import { ViewPlugin } from "@codemirror/view"
import { Decoration } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { WidgetType } from "@codemirror/view"

import { getNoteBlockFromPos } from "./block"


class MathResult extends WidgetType {
    constructor(result) {
        super()
        this.result = result
    }

    eq(other) { return other.result == this.result }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.className = "heynote-math-result"
        wrap.innerHTML = this.result
        return wrap
    }
    ignoreEvent() { return false }
}

function mathDeco(view) {
    let mathParsers = new WeakMap()
    let builder = new RangeSetBuilder()
    for (let { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
            let line = view.state.doc.lineAt(pos)
            var block = getNoteBlockFromPos(view.state, pos)

            if (block && block.language.name == "math") {
                // get math.js parser and cache it for this block
                let parser = mathParsers.get(block)
                if (!parser) {
                    parser = math.parser()
                    mathParsers.set(block, parser)
                }
                
                // evaluate math line
                let result
                try {
                    result = parser.evaluate(line.text)
                } catch (e) {
                    // suppress any errors
                }

                // if we got a result from math.js, add the result decoration
                if (result !== undefined) {
                    builder.add(line.to, line.to, Decoration.widget({widget: new MathResult(math.format(result, 8)), side: 1}))
                }
            }
            pos = line.to + 1
        }
    }
    return builder.finish()
}


export const mathBlock = ViewPlugin.fromClass(class {
    decorations

    constructor(view) {
        this.decorations = mathDeco(view)
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = mathDeco(update.view)
        }
    }
}, {
    decorations: v => v.decorations
})

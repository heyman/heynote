import { ViewPlugin } from "@codemirror/view"
import { Decoration } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { WidgetType } from "@codemirror/view"

import { getNoteBlockFromPos } from "./block"
import { CURRENCIES_LOADED } from "../annotation"


class MathResult extends WidgetType {
    constructor(displayResult, copyResult) {
        super()
        this.displayResult = displayResult
        this.copyResult = copyResult
    }

    eq(other) { return other.displayResult == this.displayResult }

    toDOM() {
        const wrap = document.createElement("span")
        wrap.className = "heynote-math-result"
        const inner = document.createElement("span")
        inner.className = "inner"
        inner.innerHTML = this.displayResult
        wrap.appendChild(inner)
        inner.addEventListener("click", (e) => {
            e.preventDefault()
            navigator.clipboard.writeText(this.copyResult)
            const copyElement = document.createElement("i")
            copyElement.className = "heynote-math-result-copied"
            copyElement.innerHTML = "Copied!"
            wrap.appendChild(copyElement)
            copyElement.offsetWidth // trigger reflow so that the animation is shown
            copyElement.className = "heynote-math-result-copied fade-out"
            setTimeout(() => {
                copyElement.remove()
            }, 1700)
        })
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
                let {parser, prev} = mathParsers.get(block) || {}
                if (!parser) {
                    parser = window.math.parser()
                    mathParsers.set(block, {parser, prev})
                }
                
                // evaluate math line
                let result
                try {
                    parser.set("prev", prev)
                    result = parser.evaluate(line.text)
                    if (result !== undefined) {
                        mathParsers.set(block, {parser, prev:result})
                    }
                } catch (e) {
                    // suppress any errors
                }

                // if we got a result from math.js, add the result decoration
                if (result !== undefined) {
                    let format = parser.get("format")

                    let resultWidget
                    if (typeof(result) === "string") {
                        resultWidget = new MathResult(result, result)
                    } else if (format !== undefined && typeof(format) === "function") {
                        try {
                            resultWidget = new MathResult(format(result), format(result))
                        } catch (e) {
                            // suppress any errors
                        }
                    }
                    if (resultWidget === undefined) {
                        resultWidget = new MathResult(
                            math.format(result, {
                                precision: 8,
                                upperExp: 8,
                                lowerExp: -6,
                            }),
                            math.format(result, {
                                notation: "fixed",
                            })
                        )
                    }
                    builder.add(line.to, line.to, Decoration.widget({
                        widget: resultWidget,
                        side: 1,
                    }))
                }
            }
            pos = line.to + 1
        }
    }
    return builder.finish()
}


// This function checks if any of the transactions has the given annotation
const transactionsHasAnnotation = (transactions, annotation) => {
    return transactions.some(tr => tr.annotations.some(a => a.value === annotation))
}

export const mathBlock = ViewPlugin.fromClass(class {
    decorations

    constructor(view) {
        this.decorations = mathDeco(view)
    }

    update(update) {
        // If the document changed, the viewport changed, or the transaction was annotated with the CURRENCIES_LOADED annotation, 
        // update the decorations. The reason we need to check for CURRENCIES_LOADED annotations is because the currency rates are 
        // updated asynchronously
        if (update.docChanged || update.viewportChanged || transactionsHasAnnotation(update.transactions, CURRENCIES_LOADED)) {
            this.decorations = mathDeco(update.view)
        }
    }
}, {
    decorations: v => v.decorations
})

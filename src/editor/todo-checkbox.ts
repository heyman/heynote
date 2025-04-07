import { EditorView, Decoration } from "@codemirror/view"
import { syntaxTree, ensureSyntaxTree } from "@codemirror/language"
import { WidgetType } from "@codemirror/view"
import { ViewUpdate, ViewPlugin, DecorationSet } from "@codemirror/view"

import { isMonospaceFont } from "./theme/font-theme"
import { transactionsHasAnnotation, SET_FONT } from "./annotation"


class CheckboxWidget extends WidgetType {
    constructor(readonly checked: boolean, readonly monospace: boolean) { super() }

    eq(other: CheckboxWidget) { return other.checked == this.checked && other.monospace == this.monospace }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.setAttribute("aria-hidden", "true")
        wrap.className = "cm-taskmarker-toggle"
        
        let box = document.createElement("input")
        box.type = "checkbox"
        box.checked = this.checked
        box.style.margin = "0"
        box.style.padding = "0"

        if (this.monospace) {
            // if the font is monospaced, we'll set the content of the wrapper to "   " and the 
            // position of the checkbox to absolute, since three spaces will be the same width
            // as "[ ]" and "[x]" so that characters on different lines will line up
            wrap.appendChild(document.createTextNode("   "))
            wrap.style.position = "relative"
            box.style.position = "absolute"
            box.style.top = "0"
            box.style.left = "0.25em"
            box.style.width = "1.1em"
            box.style.height = "1.1em"
        } else {
            // if the font isn't monospaced, we'll let the checkbox take up as much space as needed
            box.style.position = "relative"
            box.style.top = "0.1em"
            box.style.marginRight = "0.5em"
        }
        wrap.appendChild(box)
        return wrap
    }

    ignoreEvent() { return false }
}


function checkboxes(view: EditorView) {
    let widgets: any = []
    for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: (nodeRef) => {
                // make sure we only enter markdown nodes
                if (nodeRef.name == "Note") {
                    let langNode = nodeRef.node.firstChild?.firstChild
                    if (langNode) {
                        const language = view.state.doc.sliceString(langNode.from, langNode.to)
                        if (!language.startsWith("markdown")) {
                            return false
                        }
                    }
                }
                
                if (nodeRef.name == "TaskMarker") {
                    // the Markdown parser creates a TaskMarker for "- [x]", but we don't want to replace it with a
                    // checkbox widget, unless its followed by a space
                    if (view.state.doc.sliceString(nodeRef.to, nodeRef.to+1) === " ") {
                        let isChecked = view.state.doc.sliceString(nodeRef.from, nodeRef.to).toLowerCase() === "[x]"
                        let deco = Decoration.replace({
                            widget: new CheckboxWidget(isChecked, view.state.facet(isMonospaceFont)),
                            inclusive: false,
                        })
                        widgets.push(deco.range(nodeRef.from, nodeRef.to))
                    }
                }
            }
        })
    }
    return Decoration.set(widgets)
}


function toggleBoolean(view: EditorView, pos: number) {
    let before = view.state.doc.sliceString(pos-3, pos).toLowerCase()
    let change
    if (before === "[x]") {
        change = { from: pos - 3, to: pos, insert: "[ ]" }
    } else if (before === "[ ]") {
        change = { from: pos - 3, to: pos, insert: "[x]" }
    } else {
        return false
    }
    view.dispatch({ changes: change })
    return true
}


/**
 * A plugin that replaces [ ] and [x] with checkboxes to task list items in Markup mode
 */
export const todoCheckboxPlugin = [
    ViewPlugin.fromClass(class {
        decorations: DecorationSet

        constructor(view: EditorView) {
            this.decorations = checkboxes(view)
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged || transactionsHasAnnotation(update.transactions, SET_FONT)) {
                this.decorations = checkboxes(update.view)
            }
        }
    }, {
        decorations: v => v.decorations,

        eventHandlers: {
            mousedown: (e, view) => {
                let target = e.target as HTMLElement
                if (target.nodeName == "INPUT" && target.parentElement!.classList.contains("cm-taskmarker-toggle"))
                    return toggleBoolean(view, view.posAtDOM(target))
            }
        }
    }),
]

import { EditorView, Decoration } from "@codemirror/view"
import { WidgetType } from "@codemirror/view"
import { ViewUpdate, ViewPlugin, DecorationSet } from "@codemirror/view"
import { EditorState, SelectionRange } from "@codemirror/state"

import { getNoteBlockFromPos } from "./block/block"
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
        box.tabIndex = -1
        box.style.margin = "0"
        box.style.padding = "0"

        if (this.monospace) {
            // if the font is monospaced, we'll set the content of the wrapper to "   " and the 
            // position of the checkbox to absolute, since three spaces will be the same width
            // as "[ ]" and "[x]" so that characters on different lines will line up
            wrap.appendChild(document.createTextNode("    "))
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

const checkboxRegex = /^([\t\f\v ]*-[\t\f\v ]*)\[( |x|X)\] /gm
const checkboxLineRegex = /^([\t\f\v ]*-[\t\f\v ]*)\[( |x|X)\] /

function checkboxes(view: EditorView) {
    let widgets: any = []

    for (let { from, to } of view.visibleRanges) {
        let range = view.state.sliceDoc(from, to)
        let match
        while (match = checkboxRegex.exec(range)) {
            if (getNoteBlockFromPos(view.state, from + match.index)?.language?.name === "markdown") {
                let deco = Decoration.replace({
                    widget: new CheckboxWidget(match[2] === "x" || match[2] === "X", view.state.facet(isMonospaceFont)),
                    inclusive: false,
                })
                widgets.push(deco.range(from + match.index + match[1].length, from + match.index + match[0].length))
            }
        }
    }
    return Decoration.set(widgets)
}


function toggleBoolean(view: EditorView, pos: number) {
    let before = view.state.doc.sliceString(pos, pos+4).toLowerCase()
    let change
    if (before === "[x] ") {
        change = { from: pos, to: pos+4, insert: "[ ] " }
    } else if (before === "[ ] ") {
        change = { from: pos, to: pos+4, insert: "[x] " }
    } else {
        return false
    }
    view.dispatch({ changes: change })
    return true
}

type CheckboxTarget = {
    from: number
    checked: boolean
}

function checkboxTargetFromLine(state: EditorState, line: { from: number; text: string }): CheckboxTarget | null {
    const block = getNoteBlockFromPos(state, line.from)
    if (!block || block.language?.name !== "markdown") {
        return null
    }
    const match = checkboxLineRegex.exec(line.text)
    if (!match) {
        return null
    }
    return {
        from: line.from + match[1].length + 1,
        checked: match[2] === "x" || match[2] === "X",
    }
}

function selectedLines(state: EditorState, ranges: readonly SelectionRange[]) {
    const lines = []
    const seen = new Set<number>()
    for (const range of ranges) {
        if (range.empty) {
            continue
        }
        let startLine = state.doc.lineAt(range.from)
        let endLine = state.doc.lineAt(range.to)
        if (range.to === endLine.from && range.to > 0) {
            endLine = state.doc.lineAt(range.to - 1)
        }
        let line = startLine
        while (true) {
            if (!seen.has(line.from)) {
                lines.push(line)
                seen.add(line.from)
            }
            if (line.number === endLine.number) {
                break
            }
            line = state.doc.line(line.number + 1)
        }
    }
    return lines
}

export const toggleCheckbox = (view: EditorView) => {
    if (view.state.readOnly) {
        return false
    }
    const { state } = view
    const ranges = state.selection.ranges
    const hasRangeSelection = ranges.some(range => !range.empty)
    const targets: CheckboxTarget[] = []

    if (hasRangeSelection) {
        for (const line of selectedLines(state, ranges)) {
            const target = checkboxTargetFromLine(state, line)
            if (target) {
                targets.push(target)
            }
        }
        if (targets.length === 0) {
            return false
        }
        const checkedCount = targets.filter(target => target.checked).length
        const uncheckedCount = targets.length - checkedCount
        const targetChecked = checkedCount <= uncheckedCount
        const changes = targets
            .filter(target => target.checked !== targetChecked)
            .map(target => ({
                from: target.from,
                to: target.from + 1,
                insert: targetChecked ? "x" : " ",
            }))
        changes.sort((a, b) => a.from - b.from)
        if (changes.length === 0) {
            return false
        }
        view.dispatch({ changes, userEvent: "input" })
        return true
    }

    const seenLines = new Set<number>()
    for (const range of ranges) {
        const line = state.doc.lineAt(range.head)
        if (seenLines.has(line.from)) {
            continue
        }
        seenLines.add(line.from)
        const target = checkboxTargetFromLine(state, line)
        if (target) {
            targets.push(target)
        }
    }
    if (targets.length === 0) {
        return false
    }
    const changes = targets.map(target => ({
        from: target.from,
        to: target.from + 1,
        insert: target.checked ? " " : "x",
    }))
    changes.sort((a, b) => a.from - b.from)
    view.dispatch({ changes, userEvent: "input" })
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

        provide: plugin => EditorView.atomicRanges.of(view => {
            return view.plugin(plugin)?.decorations || Decoration.none
        }),

        eventHandlers: {
            mousedown: (e, view) => {
                let target = e.target as HTMLElement
                if (target.nodeName == "INPUT" && target.parentElement!.classList.contains("cm-taskmarker-toggle"))
                    return toggleBoolean(view, view.posAtDOM(target))
            }
        }
    }),
]

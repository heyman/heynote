import { WidgetType } from "@codemirror/view"
import { formatFileSize } from "./document-parsing.js"

export class DocumentWidget extends WidgetType {
    constructor({ id, path, name, size, selected, isFolded }) {
        super()
        this.id = id
        this.path = path
        this.name = name
        this.size = size
        this.selected = selected
        this.isFolded = isFolded
    }

    eq(other) {
        return other.path === this.path &&
            other.name === this.name &&
            other.size === this.size &&
            other.selected === this.selected &&
            other.isFolded === this.isFolded &&
            other.id === this.id
    }

    getClassName() {
        return "heynote-document" + (this.selected ? " selected" : "") + (this.isFolded ? " folded" : "")
    }

    toDOM(view) {
        const wrap = document.createElement("span")
        wrap.dataset.id = this.id
        wrap.className = this.getClassName()

        const inner = document.createElement("span")
        inner.className = "inner"
        wrap.appendChild(inner)

        const highlightBorder = document.createElement("span")
        highlightBorder.className = "highlight-border"
        inner.appendChild(highlightBorder)

        const iconSpan = document.createElement("span")
        iconSpan.className = "doc-icon"
        iconSpan.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M4 0h5.5v4.5H14V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm6 0 4 4h-4V0zM4 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5H9.5A1.5 1.5 0 0 1 8 4V1H4z"/></svg>`
        inner.appendChild(iconSpan)

        const link = document.createElement("a")
        link.className = "doc-link"
        link.href = "#"
        link.title = "Open document in native app"
        link.setAttribute("role", "button")

        const nameSpan = document.createElement("span")
        nameSpan.className = "doc-name"
        nameSpan.textContent = this.name || "Document"
        link.appendChild(nameSpan)

        const openIconSpan = document.createElement("span")
        openIconSpan.className = "doc-open-icon"
        openIconSpan.innerHTML = `<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>`
        link.appendChild(openIconSpan)

        const handleOpen = async (event) => {
            event.preventDefault()
            event.stopPropagation()
            if (typeof window?.heynote?.buffer?.openDocument === "function") {
                try {
                    await window.heynote.buffer.openDocument(this.path)
                } catch (err) {
                    console.error("Failed to open document:", err)
                }
            }
        }

        link.addEventListener("mousedown", (e) => {
            e.preventDefault()
            e.stopPropagation()
        })
        link.addEventListener("click", handleOpen)

        inner.appendChild(link)

        if (this.size !== undefined && this.size !== null && !isNaN(this.size)) {
            const sizeSpan = document.createElement("span")
            sizeSpan.className = "doc-size"
            sizeSpan.textContent = formatFileSize(this.size)
            inner.appendChild(sizeSpan)
        }

        return wrap
    }

    updateDOM(dom, view) {
        dom.dataset.id = this.id
        dom.className = this.getClassName()
        const nameEl = dom.querySelector(".doc-name")
        if (nameEl) {
            nameEl.textContent = this.name || "Document"
        }
        return true
    }

    ignoreEvent(e) {
        if (e.target && e.target.closest(".doc-link")) {
            return true
        }
        return false
    }
}

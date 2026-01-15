import { EditorView } from "@codemirror/view"
import { WidgetType } from "@codemirror/view"
import { doc } from "prettier"

import { setImageDisplayDimensions } from "./image-parsing.js"

const FOLDED_HEIGHT = 16

export class ImageWidget extends WidgetType {
    constructor({id, path, width, height, displayHeight, displayWidth, selected, isFolded, domEventCompartment}) {
        super()
        this.id = id
        this.path = path
        this.selected = selected
        this.width = width
        this.height = height
        this.displayWidth = displayWidth
        this.displayHeight = displayHeight
        this.isFolded = isFolded
        this.domEventCompartment = domEventCompartment
    }

    eq(other) {
        return other.path === this.path && 
            this.width === other.width &&
            this.height === other.height && 
            this.displayWidth === other.displayWidth &&
            this.displayHeight === other.displayHeight &&
            this.selected === other.selected &&
            this.isFolded === other.isFolded &&
            this.id === other.id
    }

    getClassName() {
        return "heynote-image" + (this.selected ? " selected" : "") + (this.isFolded ? " folded" : "")
    }

    getHeight(img) {
        let height
        if (this.isFolded) {
            height = FOLDED_HEIGHT
        } else if (this.displayHeight) {
            height = this.displayHeight
        } else {
            height = this.height / window.devicePixelRatio
        }
        return height + "px"
    }

    getWidth(img) {
        let width
        if (this.isFolded) {
            width = FOLDED_HEIGHT * (this.width / this.height)
        } else if (this.displayWidth) {
            width = this.displayWidth
        } else {
            width = this.width / window.devicePixelRatio
        }
        return width ? width + "px" : ""
    }

    toDOM(view) {
        //console.log("toDOM", this.selected, this.height)
        let wrap = document.createElement("div")
        //wrap.setAttribute("aria-hidden", "true")
        wrap.className = this.getClassName()

        const resizeHandle = document.createElement("div")
        resizeHandle.className = "resize-handle"
        resizeHandle.innerHTML = "<div class='icon'></div>"
        wrap.appendChild(resizeHandle)

        let inner = document.createElement("div")
        inner.className = "inner"
        wrap.appendChild(inner)
        //wrap.addEventListener("click", (e) => {
        //    console.log("click", e)
        //    wrap.focus()
        //})

        const highlightBorder = document.createElement("div")
        highlightBorder.className = "highlight-border"
        inner.appendChild(highlightBorder)
        
        
        let img = document.createElement("img")
        img.src = this.path
        img.style.height = this.getHeight(img)
        img.style.width = this.getWidth(img)
        //img.style.maxWidth = "100%"
        //img.tabIndex = -1
        inner.appendChild(img)
        

        let initialWidth, initialHeight, initialX, initialY
        const onMousemove = (e) => {
            //console.log("mousemove", e)
            const aspect = this.width / this.height
            let width = initialWidth + (e.pageX - initialX)
            let height = initialHeight + (e.pageY - initialY)

            const heightFromWidth = width / aspect
            const widthFromHeight = height * aspect

            if (heightFromWidth <= height) {
                // width is the limiting factor
                height = heightFromWidth
            } else {
                // height is the limiting factor
                width = widthFromHeight
            }

            // clamp dimensions
            width = Math.max(width, 16)
            height = width / aspect
            if (height < 16) {
                height = 16
                width = height * aspect
            }

            img.style.width = width + "px"
            img.style.height = height + "px"
        }
        const endResize = () => {
            view.dispatch({effects: [this.domEventCompartment.reconfigure([])]})
            setImageDisplayDimensions(view, this.id, img.width, img.height)
        }
        resizeHandle.addEventListener("mousedown", (e) => {
            //console.log("mousedown", e)
            e.preventDefault()
            initialWidth = img.getBoundingClientRect().width
            initialHeight = img.getBoundingClientRect().height
            initialX = e.pageX
            initialY = e.pageY
            
            view.dispatch({effects: [this.domEventCompartment.reconfigure([
                EditorView.domEventObservers({
                    mousemove: (e) => {
                        onMousemove(e)
                    },
                    mouseup: (e) => {
                        //console.log("mouseup")
                        endResize()
                    },
                    mouseleave: (e) => {
                        //console.log("mouseleave")
                        endResize()
                    },
                })
            ])]})
        })

        return wrap
    }

    updateDOM(dom, view) {
        //console.log("updateDOM:", dom, this.selected, this.height)
        dom.className = this.getClassName()
        const img = dom.querySelector("img")
        img.src = this.path
        img.style.height = this.getHeight(img)
        img.style.width = this.getWidth(img)
        return true
    }

    ignoreEvent() { return false }
}

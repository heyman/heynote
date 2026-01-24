import { EditorView } from "@codemirror/view"
import { WidgetType } from "@codemirror/view"

import { copyImage } from "../clipboard/copy-paste.js"
import { setImageDisplayDimensions } from "./image-parsing.js"
import { useHeynoteStore } from "../../stores/heynote-store.js"

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
        this.idealWidth = this.width / window.devicePixelRatio
        this.idealHeight = this.height / window.devicePixelRatio
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
            height = this.idealHeight
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
            width = this.idealWidth
        }
        return width ? width + "px" : ""
    }

    toDOM(view) {
        //console.log("toDOM", this.selected, this.height)
        const heynoteStore = useHeynoteStore()
        let wrap = document.createElement("div")
        wrap.dataset.id = this.id
        wrap.dataset.idealWidth = this.idealWidth
        wrap.dataset.idealHeight = this.idealHeight
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

        const buttonsContainer = document.createElement("div")
        buttonsContainer.className = "buttons-container"
        inner.appendChild(buttonsContainer)
        const copyButton = document.createElement("button")
        copyButton.innerHTML = "<span>Copy</span>"
        buttonsContainer.appendChild(copyButton)
        copyButton.addEventListener("mousedown", (event) => {
            event.preventDefault()
        })
        copyButton.addEventListener("click", async (event) => {
            event.preventDefault()
            await copyImage(img.src)
            copyButton.innerText = "Copied!"
            setTimeout(() => {
                copyButton.innerText = "Copy"
            }, 2000)
        })
        const drawButton = document.createElement("button")
        drawButton.className = "draw"
        drawButton.innerHTML = "<span>Draw</span>"
        buttonsContainer.appendChild(drawButton)
        drawButton.addEventListener("mousedown", (event) => {
            event.preventDefault()
        })
        drawButton.addEventListener("click", (event) => {
            event.preventDefault()
            heynoteStore.openDrawImageModal(this.path, this.id)
        })
        
        
        let img = document.createElement("img")
        img.src = this.path
        img.style.height = this.getHeight(img)
        img.style.width = this.getWidth(img)
        inner.appendChild(img)
        

        let initialWidth, initialHeight, initialX, initialY
        let shouldSnap = true
        const onMousemove = (e) => {
            //console.log("mousemove", e)
            const idealWidth = parseFloat(wrap.dataset.idealWidth)
            const idealHeight = parseFloat(wrap.dataset.idealHeight)

            const aspect = idealWidth / idealHeight
            let width = initialWidth + (e.pageX - initialX)
            let height = initialHeight + (e.pageY - initialY)

            const heightFromWidth = width / aspect
            const widthFromHeight = height * aspect

            if (heightFromWidth <= height) {
                height = heightFromWidth
            } else {
                width = widthFromHeight
            }

            // snap to ideal dimensions
            const SNAP_TOLERANCE = 10
            if (shouldSnap) {
                if (Math.abs(width - idealWidth) <= SNAP_TOLERANCE  || (Math.abs(height - idealHeight) <= 10)) {
                    height = idealHeight
                    width = idealWidth
                    wrap.classList.add("snapped")
                } else if (wrap.classList.contains("snapped")) {
                    wrap.classList.remove("snapped")
                }
            } else {
                // even if snapping is turned off from the beginning (because we start at the ideal dimensions)
                // we want to enable snapping once we've passed the snap tolerance
                if (Math.abs(width - idealWidth) > SNAP_TOLERANCE && Math.abs(height - idealHeight) > SNAP_TOLERANCE) {
                    shouldSnap = true
                }
            }

            // clamp dimensions
            width = Math.max(width, 16)
            height = width / aspect
            if (height < 17) {
                height = 17
                width = height * aspect
            }

            img.style.width = width + "px"
            img.style.height = height + "px"
        }
        const endResize = () => {
            view.dispatch({effects: [this.domEventCompartment.reconfigure([])]})
            setImageDisplayDimensions(view, wrap.dataset.id, img.width, img.height)
            setTimeout(() => {
                wrap.classList.remove("resizing")
            }, 200)
        }
        resizeHandle.addEventListener("mousedown", (e) => {
            //console.log("mousedown", e)
            e.preventDefault()
            initialWidth = img.getBoundingClientRect().width
            initialHeight = img.getBoundingClientRect().height
            initialX = e.pageX
            initialY = e.pageY

            // if we start the resize at ideal dimensions snapping should be turned off (initially)
            shouldSnap = initialWidth !== this.idealWidth
            //console.log("should snap?", shouldSnap, initialWidth, this.idealWidth)

            wrap.classList.add("resizing")
            
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
                }),
                EditorView.editorAttributes.of({class: "resizing-image"}),
            ])]})
        })

        return wrap
    }

    updateDOM(dom, view) {
        dom.dataset.id = this.id
        dom.dataset.idealWidth = this.idealWidth
        dom.dataset.idealHeight = this.idealHeight
        //console.log("updateDOM:", dom, this.selected, this.height)
        dom.className = this.getClassName()
        const img = dom.querySelector("img")
        img.src = this.path
        img.style.height = this.getHeight(img)
        img.style.width = this.getWidth(img)
        return true
    }

    ignoreEvent(e) {
        return false
    }
}

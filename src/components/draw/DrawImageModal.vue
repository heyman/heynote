<script>
    import { markRaw } from "vue"
    import { Canvas, PencilBrush, FabricImage } from "fabric"

    export default {
        props: {
            imageUrl: {
                type: String,
                required: true,
            },
            imageId: {
                type: [String, Number],
                required: true,
            },
        },

        emits: ["save", "close"],

        data() {
            return {
                canvas: null,
                isLoading: true,
                loadError: null,
                zoom: 1,
                baseScale: 1,
                imageWidth: 1,
                imageHeight: 1,
                scaledWidth: 1,
                scaledHeight: 1,
                stagePaddingX: 0,
                stagePaddingY: 0,
                stageOverflow: "hidden",
                history: [],
                historyIndex: -1,
                isRestoring: false,
                isDrawing: false,
                brushColor: "#f42525",
                brushWidth: 3,
                isDrawingMode: true,
                dialogWidth: 920,
                dialogHeight: 680,
            }
        },

        async mounted() {
            window.addEventListener("keydown", this.onKeyDown)
            window.addEventListener("resize", this.onResize)
            this.$nextTick(() => {
                const stage = this.$refs.stage
                stage?.addEventListener("wheel", this.onWheel, { passive: false })
            })
            await this.initCanvas()
        },

        beforeUnmount() {
            window.removeEventListener("keydown", this.onKeyDown)
            window.removeEventListener("resize", this.onResize)
            const stage = this.$refs.stage
            stage?.removeEventListener("wheel", this.onWheel)
            this.disposeCanvas()
        },

        watch: {
            imageUrl() {
                this.initCanvas()
            },
        },

        methods: {
            async initCanvas() {
                this.disposeCanvas()
                this.isLoading = true
                this.loadError = null

                const canvasEl = this.$refs.canvas
                if (!canvasEl) {
                    return
                }

                this.canvas = markRaw(new Canvas(canvasEl, {
                    selection: false,
                }))

                this.canvas.isDrawingMode = true
                this.canvas.defaultCursor = "crosshair"
                this.isDrawingMode = true
                this.canvas.on("path:created", this.onPathCreated)
                this.canvas.on("object:modified", this.onObjectModified)
                this.canvas.on("mouse:down", this.onMouseDown)
                this.canvas.on("mouse:up", this.onMouseUp)

                const brush = new PencilBrush(this.canvas)
                brush.color = this.brushColor
                brush.width = this.brushWidth
                this.canvas.freeDrawingBrush = brush

                await this.loadImage()
            },

            async loadImage() {
                if (!this.canvas) {
                    return
                }

                try {
                    const image = await FabricImage.fromURL(this.imageUrl)

                    image.set({
                        left: 0,
                        top: 0,
                        originX: "left",
                        originY: "top",
                        selectable: false,
                        evented: false,
                        hasControls: false,
                    })


                    const width = image.width || 1
                    const height = image.height || 1

                    this.canvas.clear()
                    this.imageWidth = width
                    this.imageHeight = height
                    this.zoom = 1
                    this.updateDialogSize()
                    await this.$nextTick()
                    this.updateCanvasScale()
                    this.canvas.add(image)
                    this.canvas.sendObjectToBack(image)
                    this.canvas.requestRenderAll()
                    this.resetHistory()
                    this.captureHistory(true)

                    // calculate brush width
                    this.brushWidth = Math.min(10, Math.max(4, width / 300))
                    this.canvas.freeDrawingBrush.width = this.brushWidth
                    //console.log("brush width:", this.brushWidth)

                    this.isLoading = false
                } catch (error) {
                    console.error("Failed to load draw image", error)
                    this.isLoading = false
                    this.loadError = error
                }
            },

            onKeyDown(event) {
                if (event.key === "Escape") {
                    this.$emit("close")
                    return
                }

                const target = event.target
                const tagName = target?.tagName?.toLowerCase()
                if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
                    return
                }

                if (this.isDrawing) {
                    return
                }

                if (event.key === "Backspace" || event.key === "Delete") {
                    if (this.deleteSelection()) {
                        event.preventDefault()
                    }
                    return
                }

                const isMod = event.metaKey || event.ctrlKey
                if (!isMod) {
                    return
                }

                if (event.key === "z" && !event.shiftKey) {
                    event.preventDefault()
                    this.undo()
                    return
                }

                if (event.key === "z" && event.shiftKey) {
                    event.preventDefault()
                    this.redo()
                    return
                }

                if (event.key === "y") {
                    event.preventDefault()
                    this.redo()
                }
            },

            onResize() {
                this.updateDialogSize()
                this.$nextTick(() => {
                    this.updateCanvasScale()
                })
            },


            onMouseDown() {
                if (this.canvas?.isDrawingMode) {
                    this.isDrawing = true
                }
            },

            onMouseUp() {
                this.isDrawing = false
            },

            onPathCreated() {
                if (this.isRestoring) {
                    return
                }
                this.isDrawing = false
                this.captureHistory()
            },

            onObjectModified() {
                if (this.isRestoring) {
                    return
                }
                this.captureHistory()
            },

            deleteSelection() {
                if (!this.canvas || this.isLoading) {
                    return false
                }

                const activeObjects = this.canvas.getActiveObjects?.() || []
                if (activeObjects.length === 0) {
                    return false
                }

                activeObjects.forEach((obj) => {
                    this.canvas.remove(obj)
                })

                this.canvas.discardActiveObject()
                this.canvas.requestRenderAll()
                this.captureHistory()
                return true
            },

            onWheel(event) {
                if (!event.altKey || this.isLoading) {
                    return
                }
                event.preventDefault()
                const direction = event.deltaY < 0 ? 1 : -1
                const nextZoom = this.zoom * (direction > 0 ? 1.03 : 0.97)
                const stage = this.$refs.stage
                if (stage) {
                    const rect = stage.getBoundingClientRect()
                    const anchor = {
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                    }
                    this.setZoom(nextZoom, anchor)
                    return
                }
                this.setZoom(nextZoom)
            },

            saveImage() {
                if (!this.canvas || this.isLoading) {
                    return
                }

                const dataUrl = this.canvas.toDataURL({
                    format: "png",
                })

                this.$emit("save", dataUrl)
                this.$emit("close")
            },

            resetHistory() {
                this.history = []
                this.historyIndex = -1
            },

            captureHistory(force = false) {
                if (!this.canvas) {
                    return
                }
                if (!force && this.historyIndex >= 0 && this.isRestoring) {
                    return
                }
                const snapshot = this.canvas.toJSON()
                if (this.historyIndex < this.history.length - 1) {
                    this.history = this.history.slice(0, this.historyIndex + 1)
                }
                this.history.push(snapshot)
                this.historyIndex = this.history.length - 1
            },

            async restoreHistory(index) {
                if (!this.canvas || index < 0 || index >= this.history.length) {
                    return
                }
                this.isRestoring = true
                const snapshot = this.history[index]
                await this.canvas.loadFromJSON(snapshot, (_serialized, object) => {
                    if (object?.type === "image") {
                        object.selectable = false
                        object.evented = false
                        object.hasControls = false
                    }
                })
                this.setDrawingMode(this.isDrawingMode)
                if (this.canvas.freeDrawingBrush) {
                    this.canvas.freeDrawingBrush.color = this.brushColor
                    this.canvas.freeDrawingBrush.width = this.brushWidth
                }
                this.canvas.requestRenderAll()
                this.isRestoring = false
                this.historyIndex = index
            },

            undo() {
                if (this.historyIndex <= 0) {
                    return
                }
                this.restoreHistory(this.historyIndex - 1)
            },

            redo() {
                if (this.historyIndex >= this.history.length - 1) {
                    return
                }
                this.restoreHistory(this.historyIndex + 1)
            },

            updateCanvasScale(anchor) {
                if (!this.canvas) {
                    return
                }

                const stage = this.$refs.stage
                const stageWidth = stage?.clientWidth || this.imageWidth
                const stageHeight = stage?.clientHeight || this.imageHeight
                const prevScrollLeft = stage?.scrollLeft || 0
                const prevScrollTop = stage?.scrollTop || 0
                const prevScaledWidth = this.scaledWidth || stageWidth
                const prevScaledHeight = this.scaledHeight || stageHeight
                const prevPaddingX = this.stagePaddingX
                const prevPaddingY = this.stagePaddingY
                const prevAnchor = anchor || {
                    x: stageWidth / 2,
                    y: stageHeight / 2,
                }
                const prevViewportAnchor = {
                    x: prevScrollLeft + prevAnchor.x - prevPaddingX,
                    y: prevScrollTop + prevAnchor.y - prevPaddingY,
                }

                const dpr = window.devicePixelRatio || 1
                const logicalWidth = this.imageWidth / dpr
                const logicalHeight = this.imageHeight / dpr

                this.baseScale = Math.min(stageWidth / logicalWidth, stageHeight / logicalHeight, 1)
                const scale = this.baseScale * this.zoom
                const scaledWidth = Math.round(logicalWidth * scale)
                const scaledHeight = Math.round(logicalHeight * scale)

                this.canvas.setDimensions({ width: this.imageWidth, height: this.imageHeight })
                this.canvas.setDimensions(
                    { width: `${scaledWidth}px`, height: `${scaledHeight}px` },
                    { cssOnly: true },
                )
                this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
                const nextOverflow = scaledWidth > stageWidth || scaledHeight > stageHeight
                this.stageOverflow = nextOverflow ? "auto" : "hidden"
                this.scaledWidth = scaledWidth
                this.scaledHeight = scaledHeight
                this.stagePaddingX = scaledWidth < stageWidth ? Math.floor((stageWidth - scaledWidth) / 2) : 0
                this.stagePaddingY = scaledHeight < stageHeight ? Math.floor((stageHeight - scaledHeight) / 2) : 0

                if (stage) {
                    const anchorRatioX = prevViewportAnchor.x / Math.max(prevScaledWidth, 1)
                    const anchorRatioY = prevViewportAnchor.y / Math.max(prevScaledHeight, 1)
                    const nextAnchor = {
                        x: anchorRatioX * scaledWidth,
                        y: anchorRatioY * scaledHeight,
                    }
                    this.$nextTick(() => {
                        const maxScrollLeft = Math.max(0, scaledWidth + this.stagePaddingX * 2 - stageWidth)
                        const maxScrollTop = Math.max(0, scaledHeight + this.stagePaddingY * 2 - stageHeight)
                        stage.scrollLeft = Math.min(
                            maxScrollLeft,
                            Math.max(0, nextAnchor.x + this.stagePaddingX - prevAnchor.x),
                        )
                        stage.scrollTop = Math.min(
                            maxScrollTop,
                            Math.max(0, nextAnchor.y + this.stagePaddingY - prevAnchor.y),
                        )
                    })
                }
            },

            updateDialogSize() {
                const minWidth = 400
                const minHeight = 300
                const dpr = window.devicePixelRatio || 1
                const logicalWidth = this.imageWidth / dpr
                const logicalHeight = this.imageHeight / dpr

                const chromeWidth = 0
                const chromeHeight = 140
                const maxWidth = Math.max(minWidth, window.innerWidth)
                const maxHeight = Math.max(minHeight, window.innerHeight - 60)
                const desiredWidth = Math.max(minWidth, Math.round(logicalWidth + chromeWidth))
                const desiredHeight = Math.max(minHeight, Math.round(logicalHeight + chromeHeight))

                this.dialogWidth = Math.min(desiredWidth, maxWidth)
                this.dialogHeight = Math.min(desiredHeight, maxHeight)
            },

            zoomIn() {
                if (this.isLoading) {
                    return
                }
                this.setZoom(this.zoom + 0.2)
            },

            zoomOut() {
                if (this.isLoading) {
                    return
                }
                this.setZoom(this.zoom - 0.2)
            },

            setZoom(nextZoom, anchor) {
                this.zoom = Math.min(Math.max(nextZoom, 0.2), 4)
                this.updateCanvasScale(anchor)
            },

            resetZoom() {
                this.zoom = 1
                this.updateCanvasScale()
            },

            onBrushColorChange(event) {
                this.brushColor = event.target.value
                if (this.canvas?.freeDrawingBrush) {
                    this.canvas.freeDrawingBrush.color = this.brushColor
                }
            },

            setDrawingMode(enabled) {
                this.isDrawingMode = enabled
                if (!this.canvas) {
                    return
                }
                this.canvas.isDrawingMode = enabled
                this.canvas.selection = !enabled
                this.canvas.defaultCursor = enabled ? "crosshair" : "default"
                this.canvas.requestRenderAll()
            },

            disposeCanvas() {
                if (this.canvas) {
                    this.canvas.off("path:created", this.onPathCreated)
                    this.canvas.off("object:modified", this.onObjectModified)
                    this.canvas.off("mouse:down", this.onMouseDown)
                    this.canvas.off("mouse:up", this.onMouseUp)
                    this.canvas.dispose()
                    this.canvas = null
                }
            },
        },
    }
</script>

<template>
    <div class="draw-modal">
        <div class="dialog" :style="{ width: `${dialogWidth}px`, height: `${dialogHeight}px` }">
            <div class="header">
                <div class="header-tools-left">
                    <div class="mode-toggle">
                        <button
                            class="mode select-mode"
                            :class="{ active: !isDrawingMode }"
                            :disabled="isLoading"
                            @click="setDrawingMode(false)"
                        ></button>
                        <button
                            class="mode draw-mode"
                            :class="{ active: isDrawingMode }"
                            :disabled="isLoading"
                            @click="setDrawingMode(true)"
                        ></button>
                    </div>
                    <label class="color-picker">
                        <input
                            type="color"
                            :value="brushColor"
                            :disabled="isLoading"
                            @input="onBrushColorChange"
                        />
                    </label>
                </div>
                <div class="header-tools">
                    <div class="history-controls">
                        <button class="history undo" @click="undo" :disabled="historyIndex <= 0 || isLoading"></button>
                        <button class="history redo" @click="redo" :disabled="historyIndex >= history.length - 1 || isLoading"></button>
                    </div>
                    <div class="zoom-controls">
                        <button class="zoom" @click="zoomOut" :disabled="isLoading">-</button>
                        <div class="zoom-value">{{ Math.round(baseScale * zoom * 100) }}%</div>
                        <button class="zoom" @click="zoomIn" :disabled="isLoading">+</button>
                        <button class="zoom reset" @click="resetZoom" :disabled="isLoading">Fit</button>
                    </div>
                </div>
            </div>
            <div class="dialog-content">
                <div
                    class="canvas-stage"
                    ref="stage"
                    :class="{ scrollable: stageOverflow === 'auto' }"
                    :style="{ padding: `${stagePaddingY}px ${stagePaddingX}px` }"
                >
                    <canvas ref="canvas"></canvas>
                </div>
                <div v-if="loadError" class="error">Failed to load image.</div>
            </div>
            <div class="bottom-bar">
                <button @click="$emit('close')" class="close">Cancel</button>
                <button @click="saveImage" class="save" :disabled="isLoading">Save</button>
            </div>
        </div>
        <div class="shader"></div>
    </div>
</template>

<style lang="sass" scoped>
    .draw-modal
        z-index: 500
        position: fixed
        top: 0
        left: 0
        bottom: 0
        right: 0

        .shader
            z-index: 1
            position: absolute
            top: 0
            left: 0
            bottom: 0
            right: 0
            background: rgba(0, 0, 0, 0.5)

        .dialog
            box-sizing: border-box
            z-index: 2
            position: absolute
            left: 50%
            top: 50%
            transform: translate(-50%, -50%)
            width: auto
            height: auto
            max-width: 100%
            max-height: 100%
            display: flex
            flex-direction: column
            border-radius: 6px
            background: #fff
            color: #333
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.2)
            overflow: hidden
            +dark-mode
                background: #2f2f2f
                color: #eee
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.35)

            .header
                display: flex
                align-items: center
                justify-content: space-between
                padding: 10px 18px
                border-bottom: 1px solid #eee
                +dark-mode
                    border-bottom: 1px solid #1e1e1e
                .header-tools-left
                    display: flex
                    align-items: center
                    gap: 10px
                    .mode-toggle
                        display: flex
                        align-items: center
                        gap: 6px
                    .mode
                        height: 26px
                        width: 26px
                        border-radius: 3px
                        border: 1px solid #c7c7c7
                        background: #fff
                        cursor: pointer
                        font-size: 12px
                        background-size: 13px
                        background-position: center center
                        background-repeat: no-repeat
                        +dark-mode
                            border-color: #353535
                            background-color: #1f1f1f
                            color: #eee
                        &.active
                            border-color: transparent
                            color: #fff
                            border: none
                            +dark-mode
                                border: 2px solid var(--highlight-color)
                        &.select-mode
                            +dark-mode
                                background-image: url("@/assets/icons/arrow-pointer-white.svg")
                        &.draw-mode
                            +dark-mode
                                background-image: url("@/assets/icons/paint-white.svg")
                        &:disabled
                            opacity: 0.6
                    .color-picker input[type="color"]
                        width: 24px
                        height: 24px
                        padding: 0 2px
                        background-color: #3e3e3e
                        border: none
                        border-radius: 3px
                .header-tools
                    display: flex
                    align-items: center
                    gap: 16px
                .history-controls
                    display: flex
                    align-items: center
                    gap: 6px
                    .history
                        height: 26px
                        width: 26px
                        border-radius: 4px
                        border: 1px solid #c7c7c7
                        background: #fff
                        cursor: pointer
                        font-size: 12px
                        background-size: 13px
                        background-position: center center
                        background-repeat: no-repeat
                        background-image: url("@/assets/icons/undo-white.svg")
                        +dark-mode
                            border-color: #444
                            background-color: #1f1f1f
                            color: #eee
                        &:disabled
                            opacity: 0.4
                        &.redo
                            background-image: url("@/assets/icons/redo-white.svg")
                .zoom-controls
                    display: flex
                    align-items: center
                    gap: 6px
                    font-size: 12px
                    .zoom
                        width: 28px
                        height: 28px
                        border-radius: 4px
                        border: 1px solid #c7c7c7
                        background: #fff
                        cursor: pointer
                        +dark-mode
                            border-color: #444
                            background: #1f1f1f
                            color: #eee
                        &:disabled
                            opacity: 0.6
                            cursor: not-allowed
                    .reset
                        width: auto
                        padding: 0 10px
                    .zoom-value
                        min-width: 48px
                        text-align: center

            .dialog-content
                flex-grow: 1
                overflow: hidden
                display: flex
                flex-direction: column
                gap: 12px

                .canvas-stage
                    flex-grow: 1
                    background: #f7f7f7
                    overflow: hidden
                    display: flex
                    align-items: center
                    justify-content: center
                    &.scrollable
                        overflow: auto
                        align-items: flex-start
                        justify-content: flex-start
                    +dark-mode
                        //border-color: #1f1f1f
                        background: #222
                    canvas
                        display: block

                .error
                    font-size: 12px
                    color: #c04343

            .bottom-bar
                box-sizing: border-box
                background: #f0f0f0
                text-align: right
                padding: 10px 18px
                display: flex
                justify-content: flex-end
                gap: 10px
                border-top: 1px solid #eee
                +dark-mode
                    background: #2f2f2f
                    border-top: 1px solid #1e1e1e
                button
                    height: 32px
                    padding: 0 14px
                    border-radius: 4px
                    border: 1px solid transparent
                    cursor: pointer
                .close
                    background: transparent
                    border-color: #c7c7c7
                    color: inherit
                    +dark-mode
                        border-color: #444
                        &:hover
                            background: #444
                            
                .save
                    background: #555
                    color: #fff
                    &:disabled
                        opacity: 0.6
                        cursor: not-allowed
                    &:hover
                        background: #777
</style>

import { EditorView } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"

import { createImageTag } from "../image/image-parsing.js"

const MAX_DISPLAY_HEIGHT = 200

const buildImageTagFromFile = async (file) => {
    if (!file.type.startsWith("image/")) {
        return null
    }

    const img = new Image()
    const url = URL.createObjectURL(file)
    await new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
    })
    URL.revokeObjectURL(url)

    const width = img.naturalWidth
    const height = img.naturalHeight
    const aspect = width / height

    const filename = await window.heynote.buffer.saveImage({
        data: new Uint8Array(await file.arrayBuffer()),
        mime: file.type,
    })
    if (!filename) {
        return null
    }

    const image = {
        id: crypto.randomUUID(),
        file: "heynote-file://image/" + encodeURIComponent(filename),
        width,
        height,
    }

    if ((height / window.devicePixelRatio) > MAX_DISPLAY_HEIGHT) {
        image.displayHeight = MAX_DISPLAY_HEIGHT
        image.displayWidth = MAX_DISPLAY_HEIGHT * aspect
    }

    return createImageTag(image)
}

const insertImageTags = (view, pos, tags) => {
    const insert = tags.join("")
    view.dispatch(view.state.update({
        changes: { from: pos, to: pos, insert },
        selection: EditorSelection.cursor(pos + insert.length),
        scrollIntoView: true,
        userEvent: "input.drop",
    }))
}

export const heynoteDropPaste = () => {
    const handleDrop = async (event, view) => {
        const files = Array.from(event.dataTransfer?.files || [])
        if (!files.length || view.state.readOnly) {
            return false
        }

        event.preventDefault()
        event.stopPropagation()
        view.focus()

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            ?? view.state.selection.main.head

        const tags = []
        for (const file of files) {
            const tag = await buildImageTagFromFile(file)
            if (tag) {
                tags.push(tag)
            }
        }

        if (!tags.length) {
            return false
        }

        insertImageTags(view, pos, tags)
        return true
    }

    const handleDragOver = (event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        if (!files.length) {
            return false
        }
        event.preventDefault()
        return true
    }

    return EditorView.domEventHandlers({
        dragover: handleDragOver,
        drop: handleDrop,
    })
}

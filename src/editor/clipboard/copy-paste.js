import { EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"

import { IMAGE_MIME_TYPES } from "../../common/constants.js"

import { createImageTag } from "../image/image-parsing.js"
import { serializeToText, serializeToHeynote, serializeToHtml, unserializeFromHeynote } from "./serialize.js"


function copiedRange(state) {
    let content = [], ranges = []
    for (let range of state.selection.ranges) {
        if (!range.empty) {
            content.push(state.sliceDoc(range.from, range.to))
            ranges.push(range)
        }
    }
    if (ranges.length == 0) {
        // if all ranges are empty, we want to copy each whole (unique) line for each selection
        const copiedLines = []
        for (let range of state.selection.ranges) {
            if (range.empty) {
                const line = state.doc.lineAt(range.head)
                const lineContent = state.sliceDoc(line.from, line.to)
                if (!copiedLines.includes(line.from)) {
                    content.push(lineContent)
                    ranges.push(range)
                    copiedLines.push(line.from)
                }
            }
        }
    }
    return { text: content.join(state.lineBreak), ranges }
}


/**
 * Set up event handlers for the browser's copy & cut events, that will replace block separators with newlines
 */
export const heynoteCopyCut = (editor) => {
    let copy, cut
    copy = cut = async (event, view) => {
        event.preventDefault()
        await copyCut(editor.view, event.type == "cut", editor)
    }

    return EditorView.domEventHandlers({
        copy,
        cut,
    })
}

const toBlob = (text, type) => new Blob([text], {type:type})

const copyCut = async (view, cut, editor) => {
    let { text, ranges } = copiedRange(view.state)

    //text = text.replaceAll(BLOCK_DELIMITER_REGEX, "\n\n")
    await navigator.clipboard.write([
        new ClipboardItem({
            "text/plain": toBlob(serializeToText(text), "text/plain"),
            "text/html": toBlob(await serializeToHtml(text), "text/html"),
            "web text/heynote": toBlob(serializeToHeynote(text), "web text/heynote"),
        })
    ])

    if (cut && !view.state.readOnly) {
        view.dispatch({
            changes: ranges,
            scrollIntoView: true,
            userEvent: "delete.cut"
        })
    }

    // if we're in Emacs mode, we want to exit mark mode in case we're in it
    editor.selectionMarkMode = false

    // if Editor.deselectOnCopy is set (e.g. we're in Emacs mode), we want to remove the selection after we've copied the text
    if (editor.deselectOnCopy && !cut) {
        const newSelection = EditorSelection.create(
            view.state.selection.ranges.map(r => EditorSelection.cursor(r.head)),
            view.state.selection.mainIndex,
        )
        view.dispatch(view.state.update({
            selection: newSelection,
        }))
    }
    return true
}


function doPaste(view, input) {
    let { state } = view, changes, i = 1, text = state.toText(input)
    let byLine = text.lines == state.selection.ranges.length
    if (byLine) {
        changes = state.changeByRange(range => {
            let line = text.line(i++)
            return {
                changes: { from: range.from, to: range.to, insert: line.text },
                range: EditorSelection.cursor(range.from + line.length)
            }
        })
    } else {
        changes = state.replaceSelection(text)
    }
    view.dispatch(changes, {
        userEvent: "input.paste",
        scrollIntoView: true
    })
}

/**
 * @param editor Editor instance
 * @returns CodeMirror command that copies the current selection to the clipboard
 */
export function copyCommand(editor) {
    return (view) => copyCut(view, false, editor)
}

/**
 * @param editor Editor instance
 * @returns CodeMirror command that cuts the current selection to the clipboard
 */
export function cutCommand(editor) {
    return (view) => copyCut(view, true, editor)
}

/**
 * CodeMirror command that pastes the plain text clipboard content into the editor
 */
export async function pasteAsTextCommand(view) {
    return doPaste(view, await navigator.clipboard.readText())
}

/**
 * CodeMirror command that pastes the clipboard content into the editor
 */
export async function pasteCommand(/** @type {EditorView} */view) {
    const { dispatch, state } = view

    const items = await navigator.clipboard.read()

    for (const item of items) {
        //console.log("item:", item, item.types)
        if (item.types.includes("web text/heynote")) {
            const blob = await item.getType("web text/heynote")
            doPaste(view, unserializeFromHeynote(await blob.text()))
            return

        //} else if (itemType == "text/html") {
        //    const blob = await item.getType("text/html")
        //    console.log("raw html:", await blob.text())

        } else {
            for (const itemType of item.types) {
                //console.log(itemType, ":", await item.getType(itemType))
                // handle images data
                if (IMAGE_MIME_TYPES.includes(itemType)) {
                    const blob = await item.getType(itemType)
                    //console.log("image data:", blob.arrayBuffer())

                    // get image dimensions
                    const img = new Image();
                    const url = URL.createObjectURL(blob);
                    await new Promise((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = reject;
                        img.src = url;
                    });
                    URL.revokeObjectURL(url);
                    let width = img.naturalWidth
                    let height = img.naturalHeight
                    const aspect = width / height

                    const filename = await window.heynote.buffer.saveImage({
                        data: new Uint8Array(await blob.arrayBuffer()),
                        mime: blob.type,
                    })
                    //console.log("saved:", filename)

                    if (filename) {
                        const image = {
                            id: crypto.randomUUID(),
                            file: "heynote-file://image/" + encodeURIComponent(filename),
                            width: width,
                            height: height,
                        }
                        if ((height / window.devicePixelRatio) > 200) {
                            image.displayHeight = 200
                            image.displayWidth = 200 * aspect
                        }

                        let imageTag = createImageTag(image)

                        // if we're not on an empty line, insert on a new line after the current
                        let insertAt = state.selection.main
                        //const line = state.doc.lineAt(state.selection.main.head)
                        //if (line.to > line.from) {
                        //    imageTag = "\n" + imageTag
                        //    insertAt = {from:line.to, to: line.to}
                        //}

                        dispatch(state.update({
                            changes: {
                                from: insertAt.from,
                                to: insertAt.to,
                                insert: imageTag,
                            },
                            selection: EditorSelection.cursor(insertAt.from + imageTag.length),
                        }, {
                            scrollIntoView: true,
                            userEvent: "input",
                        }))

                        return
                    }
                }
            }
        }
    }

    return doPaste(view, await navigator.clipboard.readText())
}


export async function copyImage(url) {
    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`)
    }
    const blob = await res.blob()

    if (!blob.type.startsWith("image/")) {
        throw new Error(`Not an image content type. Got: ${contentType}`)
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
}

import { BLOCK_DELIMITER_REGEX } from "../block/block-parsing"
import { WIDGET_TAG_REGEX } from "../image/image-parsing"
import { parseImagesFromString, createImageTag } from "../image/image-parsing"
import { parseDocumentsFromString, createDocumentTag } from "../document/document-parsing"


export function serializeToText(text) {
    return text.replaceAll(BLOCK_DELIMITER_REGEX, "\n\n").replaceAll(WIDGET_TAG_REGEX, "")
}

export async function serializeToHtml(text) {
    const images = parseImagesFromString(text)
    let newText = ""
    let pos = 0
    for (const image of images) {
        newText += text.substring(pos, image.from)
        const imageData = await getImageData(image)
        const width = image.displayWidth ? image.displayWidth : image.width / window.devicePixelRatio
        const height = image.displayHeight ? image.displayHeight : image.height / window.devicePixelRatio
        newText += `<img src="${imageData}" width="${width}" height="${height}">`
        pos = image.to
    }
    newText += text.substring(pos)

    const docs = parseDocumentsFromString(newText)
    let textWithDocs = ""
    pos = 0
    for (const doc of docs) {
        textWithDocs += newText.substring(pos, doc.from)
        textWithDocs += `<a href="${doc.file}">${doc.name || "Document"}</a>`
        pos = doc.to
    }
    textWithDocs += newText.substring(pos)

    return textWithDocs.replaceAll(BLOCK_DELIMITER_REGEX, "\n\n").replaceAll("\n", "<br>")
}

export function serializeToHeynote(text) {
    return text
}

/**
 * Both block separators, images, and documents are preserved, but new UUIDs are generated
 * for the widget tags
 */
export function unserializeFromHeynote(text) {
    const images = parseImagesFromString(text)
    let newText = ""
    let pos = 0
    for (const image of images) {
        newText += text.substring(pos, image.from)
        image.id = crypto.randomUUID()
        newText += createImageTag(image)
        pos = image.to
    }
    newText += text.substring(pos)

    const docs = parseDocumentsFromString(newText)
    let finalText = ""
    pos = 0
    for (const doc of docs) {
        finalText += newText.substring(pos, doc.from)
        doc.id = crypto.randomUUID()
        finalText += createDocumentTag(doc)
        pos = doc.to
    }
    finalText += newText.substring(pos)

    return finalText
}



async function imageUrlToDataUrl(url) {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error(`Failed to read image data from ${url}`))
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(blob)
    })
}

async function getImageData(image) {
    const escapeHtmlAttr = (value) => value
        .replaceAll("&", "&amp;")
        .replaceAll("\"", "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
    
    try {
        return escapeHtmlAttr(await imageUrlToDataUrl(image.file))
    } catch (err) {
        console.error(err)
        return escapeHtmlAttr(image.file)
    }
}

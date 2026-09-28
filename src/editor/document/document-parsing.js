import { DOCUMENT_REGEX } from "@/src/common/constants.js"

export function parseDocuments(state) {
    const content = state.doc.sliceString(0, state.doc.length)
    return parseDocumentsFromString(content)
}

/**
 * Parse doc tags in the following format:
 * 
 * <∞doc;id=2d45d5f5-f912-4a8b-817f-ab14a349e585;file=heynote-file://document/contract.pdf;name=contract.pdf;size=102400∞>
 */
export function parseDocumentsFromString(content) {
    const documents = []
    const regex = new RegExp(DOCUMENT_REGEX.source, "g")
    let match

    while ((match = regex.exec(content)) !== null) {
        try {
            const rawParams = match[1]
            const params = {}
            for (const part of rawParams.split(";")) {
                if (!part) {
                    continue
                }
                const eqIdx = part.indexOf("=")
                if (eqIdx === -1) {
                    params[part] = true
                    continue
                }

                const key = part.slice(0, eqIdx)
                const value = part.slice(eqIdx + 1)
                params[key] = value
            }

            if (params.id && params.file) {
                let name = params.name
                if (name) {
                    try {
                        name = decodeURIComponent(name)
                    } catch {
                        // ignore decode errors and use raw name
                    }
                } else {
                    const parts = params.file.split("/")
                    name = decodeURIComponent(parts[parts.length - 1] || "document")
                }

                documents.push({
                    from: match.index,
                    to: match.index + match[0].length,
                    id: params.id,
                    file: params.file,
                    name,
                    size: params.size ? Number(params.size) : undefined,
                })
            }
        } catch (err) {
            const message = err?.message ?? String(err)
            console.error(`Bad <∞doc> tag at index ${match.index}: ${message}. Tag: ${match[0]}`)
        }
    }

    return documents
}

export function createDocumentTag(doc) {
    const params = [
        "id=" + doc.id,
        "file=" + doc.file,
    ]
    if (doc.name) {
        params.push("name=" + encodeURIComponent(doc.name))
    }
    if (doc.size !== undefined && doc.size !== null && !isNaN(doc.size)) {
        params.push("size=" + doc.size)
    }

    return "<∞doc;" + params.join(";") + "∞>"
}

export function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null || isNaN(bytes)) {
        return ""
    }
    if (bytes < 1024) {
        return bytes + " B"
    }
    const kb = bytes / 1024
    if (kb < 1024) {
        return kb.toFixed(1) + " KB"
    }
    const mb = kb / 1024
    if (mb < 1024) {
        return mb.toFixed(1) + " MB"
    }
    const gb = mb / 1024
    return gb.toFixed(1) + " GB"
}

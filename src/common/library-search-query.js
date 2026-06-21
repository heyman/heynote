const MIN_LIBRARY_SEARCH_QUERY_BYTES = 3
const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null

function utf8ByteLength(text) {
    if (textEncoder) {
        return textEncoder.encode(text).length
    }

    let byteLength = 0
    for (const codePoint of text) {
        byteLength += encodeURIComponent(codePoint).replace(/%[A-F\d]{2}/g, "x").length
    }
    return byteLength
}

export function isLibrarySearchQueryLongEnough(query) {
    const trimmedQuery = (query || "").trim()
    return utf8ByteLength(trimmedQuery) >= MIN_LIBRARY_SEARCH_QUERY_BYTES
}

importScripts("highlight.min.js")

const HIGHLIGHTJS_LANGUAGES = [
    "json", 
    "python", 
    "javascript", 
    "html", 
    "sql", 
    "java", 
    "plaintext", 
    "cpp", 
    "php", 
    "css", 
    "markdown",
    "xml",
    "rust",
]

onmessage = (event) => {
    //console.log("worker received message:", event.data)
    //importScripts("../../lib/highlight.min.js")

    const content = event.data.content

    // we first check some custom heuristic rules to determine if the language is JSON
    const trimmedContent = content.trim()
    if ((
        trimmedContent.startsWith("{") && 
        trimmedContent.endsWith("}")
    ) || (
        trimmedContent.startsWith("[") &&
        trimmedContent.endsWith("]")
    )) {
        try {
            if (typeof JSON.parse(trimmedContent) === "object") {
                postMessage({
                    highlightjs: {
                        language: "json",
                        relevance: 100,
                        illegal: false,
                    },
                    content: content,
                    idx: event.data.idx,
                })
                return
            }
        } catch (e) {
            // JSON could not be parsed, do nothing
        }
    }

    const result = self.hljs.highlightAuto(content, HIGHLIGHTJS_LANGUAGES);
    postMessage({
        highlightjs: {
            language: result.language,
            relevance: result.relevance,
            illegal: result.illegal,
        },
        content: content,
        idx: event.data.idx,
    })
}

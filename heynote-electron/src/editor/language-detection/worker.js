importScripts("/public/highlight.min.js")

const HIGHLIGHTJS_LANGUAGES = ["json", "python", "javascript", "html", "sql", "java", "plaintext"]

onmessage = (event) => {
    //console.log("worker received message:", event.data)
    //importScripts("../../lib/highlight.min.js")

    const result = self.hljs.highlightAuto(event.data.content, HIGHLIGHTJS_LANGUAGES);
    postMessage({
        highlightjs: {
            language: result.language,
            relevance: result.relevance,
            illegal: result.illegal,
        },
        content: event.data.content,
        idx: event.data.idx,
    })
}

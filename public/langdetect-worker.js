importScripts("guesslang.min.js")

GUESSLANG_LANGUAGES = ["json","py","html","sql","md","java","php","css","xml","cpp","rs","cs","rb","sh","yaml","toml","go","clj","ex","erl","js","ts","swift","kt","groovy","ps1","dart","scala"]

const guessLang = new self.GuessLang()

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
                    guesslang: {
                        language: "json",
                        confidence: 1.0,
                    },
                    content: content,
                    idx: event.data.idx,
                    path: event.data.path,
                })
                return
            }
        } catch (e) {
            // JSON could not be parsed, do nothing
        }
    }

    //let startTime = performance.now()
    guessLang.runModel(content).then((result) => {
        //const duration = performance.now() - startTime
        console.log("Guessing language done:", result, result[0]?.languageId, result[0]?.confidence)
        //console.log("Guessing language took", duration, "ms")

        if (result.length > 0) {
            // for the language that is most likely according to GuessLang we have a lower threshold (0.15)
            const lang = result[0]
            if (GUESSLANG_LANGUAGES.includes(lang.languageId) && lang.confidence > 0.15) {
                postMessage({
                    guesslang: {
                        language: lang.languageId,
                        confidence: lang.confidence,
                    },
                    content: content,
                    idx: event.data.idx,
                    path: event.data.path,
                })
                return
            }
        }
        for (let lang of result) {
            if (GUESSLANG_LANGUAGES.includes(lang.languageId) && lang.confidence > 0.5) {
                postMessage({
                    guesslang: {
                        language: lang.languageId,
                        confidence: lang.confidence,
                    },
                    content: content,
                    idx: event.data.idx,
                    path: event.data.path,
                })
                return
            }
        }
    })
}

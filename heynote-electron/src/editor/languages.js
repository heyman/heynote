export const LANGUAGE_TOKENS = [
    "text",
    "javascript",
    "json",
    "python",
    "html",
    "sql",
    "markdown",
    "java",
    "lezer",
    "php",
]

export const HIGHLIGHTJS_TO_TOKEN = Object.fromEntries(LANGUAGE_TOKENS.map(l => [l,l]))
HIGHLIGHTJS_TO_TOKEN["plaintext"] = "text"



import { parseMixed } from "@lezer/common"

import { jsonLanguage } from "@codemirror/lang-json"
import { pythonLanguage, python } from "@codemirror/lang-python"
import { javascriptLanguage, javascript } from "@codemirror/lang-javascript"
import { htmlLanguage, html } from "@codemirror/lang-html"
import { sql } from "@codemirror/lang-sql"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { javaLanguage, java } from "@codemirror/lang-java"
import { lezerLanguage } from "@codemirror/lang-lezer"
import { phpLanguage } from "@codemirror/lang-php"
import { rust } from "@codemirror/lang-rust"
import { cpp } from "@codemirror/lang-cpp"
import { xml } from "@codemirror/lang-xml"
import { csharp } from "@replit/codemirror-lang-csharp"
import { elixirLanguage } from "codemirror-lang-elixir"
import { mermaidLanguage } from 'codemirror-lang-mermaid'

import { NoteContent, NoteLanguage } from "./parser.terms.js"
import { LANGUAGES } from "../languages.js"

const languageMapping = Object.fromEntries(LANGUAGES.map(l => [l.token, l.parser]))

const markdownCodeLanguages = (info) => {
    if (!info || typeof info !== "string") return null
    const name = info.trim().toLowerCase()

    if (name === "js" || name === "javascript") return javascript().language
    if (name === "py" || name === "python") return python().language
    if (name === "html" || name === "xhtml") return html().language
    if (name === "java") return java().language
    if (name === "sql") return sql().language
    if (name === "rust") return rust().language
    if (name === "cpp" || name === "c++") return cpp().language
    if (name === "xml" || name === "xhtml") return xml().language
    if (name === "c#" || name === "csharp") return csharp().language

    return null
}

const markdownParserWithCode = markdown({
    codeLanguages: markdownCodeLanguages,
    addKeymap: false,
    base: { parser: markdownLanguage.parser },
}).language.parser

export function configureNesting() {
    return parseMixed((node, input) => {
        let id = node.type.id
        if (id == NoteContent) {
            let noteLang = node.node.parent.firstChild.getChildren(NoteLanguage)[0]
            let langName = input.read(noteLang?.from, noteLang?.to)
            
            // if the NoteContent is empty, we don't want to return a parser, since that seems to cause an 
            // error for StreamLanguage parsers when the buffer size is large (e.g >300 kb)
            if (node.node.from == node.node.to) {
                return null
            }
            
            if (langName === "markdown") {
                return {
                    parser: markdownParserWithCode,
                    overlay: [{from:node.from, to:node.to}],
                }
            }

            if (langName in languageMapping && languageMapping[langName] !== null) {
                return {
                    parser: languageMapping[langName],
                    overlay: [{from:node.from, to:node.to}],
                }
            }
        }
        return null
    })
}

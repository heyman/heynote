import { parseMixed } from "@lezer/common"

import { jsonLanguage } from "@codemirror/lang-json"
import { pythonLanguage } from "@codemirror/lang-python"
import { javascriptLanguage, jsxLanguage, tsxLanguage, typescriptLanguage } from "@codemirror/lang-javascript"
import { htmlLanguage } from "@codemirror/lang-html"
import { sql } from "@codemirror/lang-sql"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { javaLanguage } from "@codemirror/lang-java"
import { lezerLanguage } from "@codemirror/lang-lezer"
import { phpLanguage } from "@codemirror/lang-php"
import { cssLanguage } from "@codemirror/lang-css"
import { cppLanguage } from "@codemirror/lang-cpp"
import { xmlLanguage } from "@codemirror/lang-xml"
import { rustLanguage } from "@codemirror/lang-rust"
import { csharpLanguage } from "@replit/codemirror-lang-csharp"
import { vueLanguage } from "@codemirror/lang-vue"
import { elixirLanguage } from "codemirror-lang-elixir"
import { mermaidLanguage } from 'codemirror-lang-mermaid'

import { StreamLanguage } from "@codemirror/language"
import { ruby } from "@codemirror/legacy-modes/mode/ruby"
import { shell } from "@codemirror/legacy-modes/mode/shell"
import { yaml } from "@codemirror/legacy-modes/mode/yaml"
import { go } from "@codemirror/legacy-modes/mode/go"
import { clojure } from "@codemirror/legacy-modes/mode/clojure"
import { erlang } from "@codemirror/legacy-modes/mode/erlang"
import { toml } from "@codemirror/legacy-modes/mode/toml"
import { swift } from "@codemirror/legacy-modes/mode/swift"
import { kotlin, dart, scala } from "@codemirror/legacy-modes/mode/clike"
import { groovy } from "@codemirror/legacy-modes/mode/groovy"
import { diff } from "@codemirror/legacy-modes/mode/diff"
import { powerShell } from "@codemirror/legacy-modes/mode/powershell"
import { lua } from "@codemirror/legacy-modes/mode/lua"

import { NoteContent, NoteLanguage } from "./parser.terms.js"
import { LANGUAGES } from "../languages.js"

const languageMapping = Object.fromEntries(LANGUAGES.map(l => [l.token, l.parser]))

const fallbackLanguageMapping = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    sh: "shell",
    bash: "shell",
    yml: "yaml",
    cplusplus: "cpp",
    "c++": "cpp",
    "c#": "csharp",
    csharp: "csharp",
    go: "golang",
    rb: "ruby",
    pwsh: "powershell",
}

const knownCodeLanguages = {
    json: jsonLanguage,
    python: pythonLanguage,
    javascript: javascriptLanguage,
    typescript: typescriptLanguage,
    jsx: jsxLanguage,
    tsx: tsxLanguage,
    html: htmlLanguage,
    java: javaLanguage,
    php: phpLanguage,
    css: cssLanguage,
    xml: xmlLanguage,
    sql: sql().language,
    cpp: cppLanguage,
    rust: rustLanguage,
    csharp: csharpLanguage,
    ruby: StreamLanguage.define(ruby),
    shell: StreamLanguage.define(shell),
    yaml: StreamLanguage.define(yaml),
    toml: StreamLanguage.define(toml),
    golang: StreamLanguage.define(go),
    clojure: StreamLanguage.define(clojure),
    elixir: elixirLanguage,
    erlang: StreamLanguage.define(erlang),
    swift: StreamLanguage.define(swift),
    kotlin: StreamLanguage.define(kotlin),
    dart: StreamLanguage.define(dart),
    scala: StreamLanguage.define(scala),
    groovy: StreamLanguage.define(groovy),
    diff: StreamLanguage.define(diff),
    powershell: StreamLanguage.define(powerShell),
    lua: StreamLanguage.define(lua),
    vue: vueLanguage,
    mermaid: mermaidLanguage,
}

function normalizeLanguageName(info) {
    if (!info || typeof info !== "string") return null
    let name = info.trim().toLowerCase()
    if (name.startsWith("lang-")) name = name.slice(5)
    name = name.split(/\s+/)[0]
    if (!name) return null
    if (name in fallbackLanguageMapping) return fallbackLanguageMapping[name]
    return name
}

export const markdownCodeLanguages = (info) => {
    const name = normalizeLanguageName(info)
    if (!name) return null
    return knownCodeLanguages[name] || null
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
            let normalizedLang = normalizeLanguageName(langName) || langName

            // if the NoteContent is empty, we don't want to return a parser, since that seems to cause an 
            // error for StreamLanguage parsers when the buffer size is large (e.g >300 kb)
            if (node.node.from == node.node.to) {
                return null
            }

            if (normalizedLang === "markdown") {
                return {
                    parser: markdownParserWithCode,
                    overlay: [{ from: node.from, to: node.to }],
                }
            }

            if (normalizedLang in languageMapping && languageMapping[normalizedLang] !== null) {
                return {
                    parser: languageMapping[normalizedLang],
                    overlay: [{ from: node.from, to: node.to }],
                }
            }
        }
        return null
    })
}


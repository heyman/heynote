import { jsonLanguage } from "@codemirror/lang-json"
import { pythonLanguage } from "@codemirror/lang-python"
import { javascriptLanguage, jsxLanguage, tsxLanguage, typescriptLanguage } from "@codemirror/lang-javascript"
import { htmlLanguage } from "@codemirror/lang-html"
import { StandardSQL } from "@codemirror/lang-sql"
import { markdownLanguage } from "@codemirror/lang-markdown"
import { javaLanguage } from "@codemirror/lang-java"
import { lezerLanguage } from "@codemirror/lang-lezer"
import { phpLanguage } from "@codemirror/lang-php"
import { cssLanguage } from "@codemirror/lang-css"
import { cppLanguage } from "@codemirror/lang-cpp"
import { xmlLanguage } from "@codemirror/lang-xml"
import { rustLanguage } from "@codemirror/lang-rust"
import { csharpLanguage } from "@replit/codemirror-lang-csharp"
import { vueLanguage } from "@codemirror/lang-vue";

import { StreamLanguage } from "@codemirror/language"
import { ruby } from "@codemirror/legacy-modes/mode/ruby"
import { shell } from "@codemirror/legacy-modes/mode/shell"
import { yaml } from "@codemirror/legacy-modes/mode/yaml"
import { go } from "@codemirror/legacy-modes/mode/go"
import { clojure } from "@codemirror/legacy-modes/mode/clojure"
import { erlang } from "@codemirror/legacy-modes/mode/erlang"
import { toml } from "@codemirror/legacy-modes/mode/toml"
import { swift } from "@codemirror/legacy-modes/mode/swift"
import { kotlin, dart } from "@codemirror/legacy-modes/mode/clike"
import { groovy } from "@codemirror/legacy-modes/mode/groovy"
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";

import typescriptPlugin from "prettier/plugins/typescript"
import babelPrettierPlugin from "prettier/plugins/babel"
import htmlPrettierPlugin from "prettier/plugins/html"
import cssPrettierPlugin from "prettier/plugins/postcss"
import markdownPrettierPlugin from "prettier/plugins/markdown"
import yamlPrettierPlugin from "prettier/plugins/yaml"
import * as prettierPluginEstree from "prettier/plugins/estree";


class Language {
    /**
     * @param token: The token used to identify the language in the buffer content
     * @param name: The name of the language
     * @param parser: The Lezer parser used to parse the language
     * @param guesslang: The name of the language as used by the guesslang library
     * @param prettier: The prettier configuration for the language (if any)
     * @param abbreviations: The abbreviations used to identify the language in the language selector
     */
    constructor({ token, name, parser, guesslang, prettier, abbreviations }) {
        this.token = token
        this.name = name
        this.parser = parser
        this.guesslang = guesslang
        this.prettier = prettier
        this.abbreviations = abbreviations
    }

    get supportsFormat() {
        return !!this.prettier
    }
}

export const LANGUAGES = [
    new Language({
        token: "text",
        name: "Plain Text",
        parser: null,
        guesslang: null,
        abbreviations: ["txt"],
    }),
    new Language({
        token: "math",
        name: "Math",
        parser: null,
        guesslang: null,
        abbreviations: [],
    }),
    new Language({
        token: "json",
        name: "JSON",
        parser: jsonLanguage.parser,
        guesslang: "json",
        prettier: {parser:"json-stringify", plugins: [babelPrettierPlugin, prettierPluginEstree]},
        abbreviations: [],
    }),
    new Language({
        token: "python",
        name: "Python",
        parser: pythonLanguage.parser,
        guesslang: "py",
        abbreviations: ["py"],
    }),
    new Language({
        token: "html",
        name: "HTML",
        parser: htmlLanguage.parser,
        guesslang: "html",
        prettier: {parser:"html", plugins: [htmlPrettierPlugin]},
        abbreviations: [],
    }),
    new Language({
        token: "sql",
        name: "SQL",
        parser: StandardSQL.language.parser,
        guesslang: "sql",
        abbreviations: [],
    }),
    new Language({
        token: "markdown",
        name: "Markdown",
        parser: markdownLanguage.parser,
        guesslang: "md",
        prettier: {parser:"markdown", plugins: [markdownPrettierPlugin]},
        abbreviations: ["md"],
    }),
    new Language({
        token: "java",
        name: "Java",
        parser: javaLanguage.parser,
        guesslang: "java",
        abbreviations: [],
    }),
    new Language({
        token: "lezer",
        name: "Lezer",
        parser: lezerLanguage.parser,
        guesslang: null,
        abbreviations: [],
    }),
    new Language({
        token: "php",
        name: "PHP",
        parser: phpLanguage.parser,
        guesslang: "php",
        abbreviations: [],
    }),
    new Language({
        token: "css",
        name: "CSS",
        parser: cssLanguage.parser,
        guesslang: "css",
        prettier: {parser:"css", plugins: [cssPrettierPlugin]},
        abbreviations: [],
    }),
    new Language({
        token: "xml",
        name: "XML",
        parser: xmlLanguage.parser,
        guesslang: "xml",
        abbreviations: [],
    }),
    new Language({
        token: "cpp",
        name: "C++",
        parser: cppLanguage.parser,
        guesslang: "cpp",
        abbreviations: [],
    }),
    new Language({
        token: "rust",
        name: "Rust",
        parser: rustLanguage.parser,
        guesslang: "rs",
        abbreviations: ["rs"],
    }),
    new Language({
        token: "csharp",
        name: "C#",
        parser: csharpLanguage.parser,
        guesslang: "cs",
        abbreviations: ["cs"],
    }),
    new Language({
        token: "ruby",
        name: "Ruby",
        parser: StreamLanguage.define(ruby).parser,
        guesslang: "rb",
        abbreviations: ["rb"],
    }),
    new Language({
        token: "shell",
        name: "Shell",
        parser: StreamLanguage.define(shell).parser,
        guesslang: "sh",
        abbreviations: ["sh"],
    }),
    new Language({
        token: "yaml",
        name: "YAML",
        parser: StreamLanguage.define(yaml).parser,
        guesslang: "yaml",
        prettier: {parser:"yaml", plugins: [yamlPrettierPlugin]},
        abbreviations: ["yml"],
    }),
    new Language({
        token: "toml",
        name: "TOML",
        parser: StreamLanguage.define(toml).parser,
        guesslang: "toml",
        abbreviations: [],
    }),
    new Language({
        token: "golang",
        name: "Go",
        parser: StreamLanguage.define(go).parser,
        guesslang: "go",
        abbreviations: ["go"],
    }),
    new Language({
        token: "clojure",
        name: "Clojure",
        parser: StreamLanguage.define(clojure).parser,
        guesslang: "clj",
        abbreviations: ["clj"],
    }),
    new Language({
        token: "erlang",
        name: "Erlang",
        parser: StreamLanguage.define(erlang).parser,
        guesslang: "erl",
        abbreviations: ["erl"],
    }),
    new Language({
        token: "javascript",
        name: "JavaScript",
        parser: javascriptLanguage.parser,
        guesslang: "js",
        prettier: {parser:"babel", plugins: [babelPrettierPlugin, prettierPluginEstree]},
        abbreviations: ["js"],
    }),
    new Language({
        token: "jsx",
        name: "JSX",
        parser: jsxLanguage.parser,
        guesslang: null,
        prettier: {parser:"babel", plugins: [babelPrettierPlugin, prettierPluginEstree]},
        abbreviations: [],
    }),
    new Language({
        token: "typescript",
        name: "TypeScript",
        parser: typescriptLanguage.parser,
        guesslang: "ts",
        prettier: {parser:"typescript", plugins: [typescriptPlugin, prettierPluginEstree]},
        abbreviations: ["ts"],
    }),
    new Language({
        token: "tsx",
        name: "TSX",
        parser: tsxLanguage.parser,
        guesslang: null,
        prettier: {parser:"typescript", plugins: [typescriptPlugin, prettierPluginEstree]},
        abbreviations: [],
    }),
    new Language({
        token: "swift",
        name: "Swift",
        parser: StreamLanguage.define(swift).parser,
        guesslang: "swift",
        abbreviations: [],
    }),
    new Language({
        token: "kotlin",
        name: "Kotlin",
        parser: StreamLanguage.define(kotlin).parser,
        guesslang: "kt",
        abbreviations: ["kt"],
    }),
    new Language({
        token: "groovy",
        name: "Groovy",
        parser: StreamLanguage.define(groovy).parser,
        guesslang: "groovy",
        abbreviations: [],
    }),
    new Language({
        token: "diff",
        name: "Diff",
        parser: StreamLanguage.define(diff).parser,
        guesslang: null,
        abbreviations: [],
    }),
    new Language({
        token: "powershell",
        name: "PowerShell",
        parser: StreamLanguage.define(powerShell).parser,
        guesslang: "ps1",
        abbreviations: ["ps1"],
    }),
    new Language({
        token: "vue",
        name: "Vue",
        parser: vueLanguage.parser,
        guesslang: null,
        abbreviations: [],
    }),
    new Language({
        token: "dart",
        name: "Dart",
        parser: StreamLanguage.define(dart).parser,
        guesslang: "dart",
        abbreviations: [],
    }), 
]


const languageMapping = Object.fromEntries(LANGUAGES.map(l => [l.token, l]))

export function getLanguage(token) {
    return languageMapping[token]
}



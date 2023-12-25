import { jsonLanguage } from "@codemirror/lang-json"
import { pythonLanguage } from "@codemirror/lang-python"
import { javascriptLanguage } from "@codemirror/lang-javascript"
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

import { StreamLanguage } from "@codemirror/language"
import { ruby } from "@codemirror/legacy-modes/mode/ruby"
import { shell } from "@codemirror/legacy-modes/mode/shell"
import { yaml } from "@codemirror/legacy-modes/mode/yaml"
import { go } from "@codemirror/legacy-modes/mode/go"
import { clojure } from "@codemirror/legacy-modes/mode/clojure"
import { erlang } from "@codemirror/legacy-modes/mode/erlang"


class Language {
    constructor(token, name, parser, guesslang, supportsFormat = false) {
        this.token = token
        this.name = name
        this.parser = parser
        this.guesslang = guesslang
        this.supportsFormat = supportsFormat
    }
}

export const LANGUAGES = [
    new Language("text", "Plain Text", null, null),
    new Language("math", "Math", null, null),
    new Language("javascript", "JavaScript", javascriptLanguage.parser, "js", true),
    new Language("json", "JSON", jsonLanguage.parser, "json", true),
    new Language("python", "Python", pythonLanguage.parser, "py"),
    new Language("html", "HTML", htmlLanguage.parser, "html", true),
    new Language("sql", "SQL", StandardSQL.language.parser, "sql"),
    new Language("markdown", "Markdown", markdownLanguage.parser, "md", true),
    new Language("java", "Java", javaLanguage.parser, "java"),
    new Language("lezer", "Lezer", lezerLanguage.parser, null),
    new Language("php", "PHP", phpLanguage.parser, "php"),
    new Language("css", "CSS", cssLanguage.parser, "css", true),
    new Language("xml", "XML", xmlLanguage.parser, "xml"),
    new Language("cpp", "C++", cppLanguage.parser, "cpp"),
    new Language("rust", "Rust", rustLanguage.parser, "rust"),
    new Language("csharp", "C#", csharpLanguage.parser, "cs"),
    new Language("ruby", "Ruby", StreamLanguage.define(ruby).parser, "rb"),
    new Language("shell", "Shell", StreamLanguage.define(shell).parser, "sh"),
    new Language("yaml", "YAML", StreamLanguage.define(yaml).parser, "yaml"),
    new Language("golang", "Go", StreamLanguage.define(go).parser, "go"),
    new Language("clojure", "Clojure", StreamLanguage.define(clojure).parser, "clj"),
    new Language("erlang", "Erlang", StreamLanguage.define(erlang).parser, "erl"),
]

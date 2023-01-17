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


class Language {
    constructor(token, name, parser, highlightjs) {
        this.token = token
        this.name = name
        this.parser = parser
        this.highlightjs = highlightjs
    }
}

export const LANGUAGES = [
    new Language("text", "Plain Text", null, "plaintext"),
    new Language("javascript", "JavaScript", javascriptLanguage.parser, "javascript"),
    new Language("json", "JSON", jsonLanguage.parser, "json"),
    new Language("python", "Python", pythonLanguage.parser, "python"),
    new Language("html", "HTML", htmlLanguage.parser, "html"),
    new Language("sql", "SQL", StandardSQL.language.parser, "sql"),
    new Language("markdown", "Markdown", markdownLanguage.parser, "markdown"),
    new Language("java", "Java", javaLanguage.parser, "java"),
    //new Language("lezer", "Lezer", lezerLanguage.parser, "lezer"),
    new Language("php", "PHP", phpLanguage.parser, "php"),
    new Language("css", "CSS", cssLanguage.parser, "css"),
    new Language("xml", "XML", xmlLanguage.parser, "xml"),
    new Language("cpp", "C++", cppLanguage.parser, "cpp"),
    new Language("rust", "Rust", rustLanguage.parser, "rust"),
]


// @ts-check
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"

// These roles map language tags to the defaults and per-scheme syntax palettes.
/** @satisfies {Record<Exclude<keyof import("../../theme/types").SyntaxColors, "invalidUnderline">, import("@codemirror/language").TagStyle["tag"]>} */
const syntaxTags = {
    strikethrough: tags.strikethrough,
    keyword: tags.keyword,
    name: tags.name,
    deleted: tags.deleted,
    character: tags.character,
    property: tags.propertyName,
    macro: tags.macroName,
    variable: tags.variableName,
    function: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    functionDefinition: [tags.function(tags.definition(tags.variableName)), tags.function(tags.definition(tags.propertyName))],
    label: tags.labelName,
    color: tags.color,
    constant: tags.constant(tags.name),
    standard: tags.standard(tags.name),
    definition: tags.definition(tags.name),
    separator: tags.separator,
    brace: tags.brace,
    annotation: tags.annotation,
    number: tags.number,
    changed: tags.changed,
    modifier: tags.modifier,
    self: tags.self,
    namespace: tags.namespace,
    type: tags.typeName,
    class: tags.className,
    operator: tags.operator,
    operatorKeyword: tags.operatorKeyword,
    tag: tags.tagName,
    squareBracket: tags.squareBracket,
    angleBracket: tags.angleBracket,
    attribute: tags.attributeName,
    regexp: tags.regexp,
    quote: tags.quote,
    string: tags.string,
    link: tags.link,
    url: tags.url,
    escape: tags.escape,
    specialString: tags.special(tags.string),
    meta: tags.meta,
    monospace: tags.monospace,
    comment: tags.comment,
    strong: tags.strong,
    emphasis: tags.emphasis,
    heading: tags.heading,
    specialHeading1: tags.special(tags.heading1),
    heading1: tags.heading1,
    heading2: tags.heading2,
    heading3: tags.heading3,
    heading4: tags.heading4,
    heading5: tags.heading5,
    heading6: tags.heading6,
    atom: tags.atom,
    bool: tags.bool,
    specialVariable: tags.special(tags.variableName),
    processingInstruction: tags.processingInstruction,
    inserted: tags.inserted,
    contentSeparator: tags.contentSeparator,
    invalid: tags.invalid,
    literal: tags.literal,
    definitionVariable: tags.definition(tags.variableName),
    localVariable: tags.local(tags.variableName),
    definitionProperty: tags.definition(tags.propertyName),
}

/** @param {import("../../theme/types").ThemeMode} mode */
function createHighlightStyle(mode) {
    const rules = Object.entries(syntaxTags).map(([role, tag]) => ({
        tag,
        color: `var(--syntax-${role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)})`,
    }))

    /**
     * @param {import("@lezer/highlight").Tag} tag
     * @param {Omit<import("@codemirror/language").TagStyle, "tag">} style
     */
    const decorate = (tag, style) => {
        const rule = rules.find(rule => rule.tag === tag)
        if (!rule) throw new Error("Syntax decoration has no color role")
        Object.assign(rule, style)
    }
    decorate(tags.link, { textDecoration: "underline" })
    decorate(tags.heading, { fontWeight: "bold" })
    for (const tag of [tags.special(tags.heading1), tags.heading1, tags.heading2, tags.heading3, tags.heading4]) {
        decorate(tag, { fontWeight: "bold" })
    }
    if (mode === "light") {
        decorate(tags.heading5, { fontWeight: "bold" })
        decorate(tags.heading6, { fontWeight: "bold" })
    }
    decorate(tags.strong, { fontWeight: "bold" })
    decorate(tags.emphasis, { fontStyle: "italic" })
    decorate(tags.strikethrough, { textDecoration: "line-through" })
    if (mode === "dark") {
        decorate(tags.monospace, { fontStyle: "italic" })
        decorate(tags.comment, { fontStyle: "italic" })
        decorate(tags.link, { textUnderlinePosition: "under" })
        decorate(tags.invalid, { borderBottom: "1px dotted var(--syntax-invalid-underline)" })
    }
    return HighlightStyle.define(rules)
}

export const lightHighlightStyle = createHighlightStyle("light")
export const darkHighlightStyle = createHighlightStyle("dark")

export const lightSyntax = syntaxHighlighting(lightHighlightStyle)
export const darkSyntax = syntaxHighlighting(darkHighlightStyle)

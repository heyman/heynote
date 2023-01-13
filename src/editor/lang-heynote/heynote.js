import { parser } from "./parser.js"
import { configureNesting } from "./nested-parser.js";

import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent, codeFolding} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"

import { json } from "@codemirror/lang-json"
import { javascript } from "@codemirror/lang-javascript"


function foldNode(node) {
    //console.log("foldNode", node);
    return {from:node.from, to:node.to-1};
    //let first = node.firstChild, last = node.lastChild;
    //return first && first.to < last.from ? { from: first.to, to: last.type.isError ? node.to : last.from } : null;
}

export const HeynoteLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                NoteDelimiter: t.tagName,
            }),

            foldNodeProp.add({
                //NoteContent: foldNode,
                //NoteContent: foldInside,
                NoteContent(node) {
                    return {from:node.from, to:node.to-1}
                },
            }),
        ],
        wrap: configureNesting(),
    }),
    languageData: {
        commentTokens: {line: ";"}
    }
})
    
export function heynoteLang() {
    let wrap = configureNesting();
    let lang = HeynoteLanguage.configure({dialect:"", wrap:wrap});
    return [
        new LanguageSupport(lang, [json().support]),
    ]
}

/*export function heynote() {
    return new LanguageSupport(HeynoteLanguage)
}*/

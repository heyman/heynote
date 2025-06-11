import { parser } from "./parser.js"
import { configureNesting } from "./nested-parser.js";

import {LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent, codeFolding} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"

import { json } from "@codemirror/lang-json"
import { javascript } from "@codemirror/lang-javascript"

import { FOLD_LABEL_LENGTH } from "@/src/common/constants.js"


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
                NoteContent(node, state) {
                    //return {from:node.from, to:node.to}
                    return {from: Math.min(state.doc.lineAt(node.from).to, node.from + FOLD_LABEL_LENGTH), to: node.to}
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

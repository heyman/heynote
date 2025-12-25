import { syntaxTree } from "@codemirror/language"
import { Note, Document, NoteDelimiter } from "../lang-heynote/parser.terms.js"
import { IterMode } from "@lezer/common";

import { LANGUAGES } from '../languages.js'


// tracks the size of the first delimiter
export let firstBlockDelimiterSize


function startTimer() {
    const timeStart = performance.now();
    return function () {
      return Math.round(performance.now() - timeStart);
    };
}


/**
 * Return a list of blocks in the document from the syntax tree.
 * syntaxTreeAvailable() should have been called before this function to ensure the syntax tree is available.
 */
export function getBlocksFromSyntaxTree(state) {
    //const timer = startTimer()
    const blocks = [];  
    const tree = syntaxTree(state, state.doc.length)
    if (tree) {
        tree.iterate({
            enter: (type) => {
                if (type.type.id == Document || type.type.id == Note) {
                    return true
                } else if (type.type.id === NoteDelimiter) {
                    const langNode = type.node.getChild("NoteLanguage")
                    const language = state.doc.sliceString(langNode.from, langNode.to)
                    const isAuto = !!type.node.getChild("Auto")

                    // parse created metadata
                    let created
                    const metadataNode = type.node.getChild("Metadata")
                    if (metadataNode) {
                        for (let entry = metadataNode.firstChild; entry; entry = entry.nextSibling) {
                            if (entry.name === "MetadataEntry") {
                                const keyNode = entry.getChild("MetadataKey")
                                const valueNode = entry.getChild("MetadataValue")
                                if (!keyNode || !valueNode) continue

                                const key = state.doc.sliceString(keyNode.from, keyNode.to)
                                const value = state.doc.sliceString(valueNode.from, valueNode.to)
                                if (key === "created") {
                                    created = value
                                }
                            }
                        }
                    }

                    const contentNode = type.node.nextSibling
                    blocks.push({
                        language: {
                            name: language,
                            auto: isAuto,
                        },
                        content: {
                            from: contentNode.from,
                            to: contentNode.to,
                        },
                        delimiter: {
                            from: type.from,
                            to: type.to,
                        },
                        range: {
                            from: type.node.from,
                            to: contentNode.to,
                        },
                        created,
                    })
                    return false;
                }
                return false;
            },
            mode: IterMode.IgnoreMounts,
        });
        firstBlockDelimiterSize = blocks[0]?.delimiter.to
    }
    //console.log("getBlocksSyntaxTree took", timer(), "ms")
    return blocks
}


const languageTokensMatcher = LANGUAGES.map(l => l.token).join("|")
export const BLOCK_DELIMITER_REGEX = new RegExp(`\\n∞∞∞(${languageTokensMatcher})(-a)?(?:;[^\\n]+)*\\n`, "g")
// regex to pull out ;created=...
const CREATED_METADATA_REGEX = /;created=([^;\n]+)/

/**
 * Parse blocks from document's string contents using String.indexOf()
 */
export function getBlocksFromString(state) {
        //console.log("parsing from string!")
        //const timer = startTimer()
        const blocks = []
        const doc = state.doc
        if (doc.length === 0) {
            return [];
        }
        const content = doc.sliceString(0, doc.length)
        
        const matches = [...content.matchAll(BLOCK_DELIMITER_REGEX)]

        for (let i=0; i<matches.length; i++) {
            const match = matches[i]
            const nextMatch = i < matches.length - 1 ? matches[i+1] : null

            const blockStart = match.index
            const blockEnd = nextMatch ? nextMatch.index : doc.length
            const delimiterEnd = match.index + match[0].length
            //const contentFrom = delimiterEnd + 1

            // parse created time
            const delimiterText = match[0]
            const createdMatch = delimiterText.match(CREATED_METADATA_REGEX)
            const created = createdMatch ? createdMatch[1] : undefined

            const block = {
                language: {
                    name: match[1],
                    auto: match[2] === "-a",
                },
                content: {
                    from: delimiterEnd,
                    to: blockEnd,
                },
                delimiter: {
                    from: blockStart,
                    to: delimiterEnd,
                },
                range: {
                    from: blockStart,
                    to: blockEnd,
                },
                created: created,
            };
            blocks.push(block);
        }
        firstBlockDelimiterSize = blocks[0]?.delimiter.to
        //console.log("getBlocksFromString() took", timer(), "ms")
        return blocks
}

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { redoDepth } from "@codemirror/commands";
import { getActiveNoteBlock, blockState } from "../block/block";
import { levenshtein_distance } from "./levenshtein";
import { LANGUAGES } from "../languages";
import { changeLanguageTo } from "../block/commands";
import { LANGUAGE_CHANGE } from "../annotation";

const GUESSLANG_TO_TOKEN = Object.fromEntries(LANGUAGES.map(l => [l.guesslang,l.token]))


export function languageDetection(getView) {
    const previousBlockContent = {}
    let idleCallbackId = null

    const detectionWorker = new Worker('langdetect-worker.js?worker');
    detectionWorker.onmessage = (event) => {
        //console.log("event:", event.data)
        if (!event.data.guesslang.language) {
            return
        }
        const view = getView()
        const state = view.state
        const block = getActiveNoteBlock(state)
        const newLang = GUESSLANG_TO_TOKEN[event.data.guesslang.language]
        if (block.language.auto === true && block.language.name !== newLang) {
            console.log("New auto detected language:", newLang, "Confidence:", event.data.guesslang.confidence)
            let content = state.doc.sliceString(block.content.from, block.content.to)
            const threshold = content.length * 0.1
            if (levenshtein_distance(content, event.data.content) <= threshold) {
                // the content has not changed significantly so it's safe to change the language
                if (redoDepth(state) === 0) {
                    console.log("Changing language to", newLang)
                    changeLanguageTo(state, view.dispatch, block, newLang, true)
                } else {
                    console.log("Not changing language because the user has undo:ed and has redo history")
                }
            } else {
                console.log("Content has changed significantly, not setting new language")
            }
        }
    }

    const plugin = EditorView.updateListener.of(update => {
        if (update.docChanged) {
            if (idleCallbackId !== null) {
                cancelIdleCallback(idleCallbackId)
                idleCallbackId = null
            }

            idleCallbackId = requestIdleCallback(() => {
                idleCallbackId = null
                
                const range = update.state.selection.asSingle().ranges[0]
                const blocks = update.state.facet(blockState)
                let block = null, idx = null;
                for (let i=0; i<blocks.length; i++) {
                    if (blocks[i].content.from <= range.from && blocks[i].content.to >= range.from) {
                        block = blocks[i]
                        idx = i
                        break
                    }
                }
                if (block === null) {
                    return
                } else if (block.language.auto === false) {
                    // if language is not auto, set it's previousBlockContent to null so that we'll trigger a language detection
                    // immediately if the user changes the language to auto
                    delete previousBlockContent[idx]
                    return
                }

                const content = update.state.doc.sliceString(block.content.from, block.content.to)
                if (content === "" && redoDepth(update.state) === 0) {
                    // if content is cleared, set language to plaintext
                    const view = getView()
                    const block = getActiveNoteBlock(view.state)
                    if (block.language.name !== "text") {
                        changeLanguageTo(view.state, view.dispatch, block, "text", true)
                    }
                    delete previousBlockContent[idx]
                }
                if (content.length <= 8) {
                    return
                }
                const threshold = content.length * 0.1
                if (!previousBlockContent[idx] || levenshtein_distance(previousBlockContent[idx], content) >= threshold) {
                    // the content has changed significantly, so schedule a language detection
                    //console.log("Scheduling language detection for block", idx, "with threshold", threshold)
                    detectionWorker.postMessage({
                        content: content,
                        idx: idx,
                    })
                    previousBlockContent[idx] = content
                }
            })
        }
    })

    return plugin
}


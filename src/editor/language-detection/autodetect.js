import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { getActiveNoteBlock, blockState } from "../block/note-block";
import { levenshtein_distance } from "./levenshtein";
import { HIGHLIGHTJS_TO_TOKEN } from "../languages";
import { changeLanguageTo } from "../block/commands";
import { LANGUAGE_CHANGE } from "../annotation";


export function languageDetection(getView) {
    const previousBlockContent = []
    let idleCallbackId = null

    const detectionWorker = new Worker('langdetect-worker.js?worker');
    detectionWorker.onmessage = (event) => {
        //console.log("event:", event.data)
        if (!event.data.highlightjs.language) {
            return
        }
        const view = getView()
        const state = view.state
        const block = getActiveNoteBlock(state)
        const newLang = HIGHLIGHTJS_TO_TOKEN[event.data.highlightjs.language]
        if (block.language.auto === true && block.language.name !== newLang) {
            console.log("New auto detected language:", newLang, "Relevance:", event.data.highlightjs.relevance)
            if (event.data.highlightjs.relevance >= 5) {
                let content = state.doc.sliceString(block.content.from, block.content.to)
                const threshold = content.length * 0.1
                if (levenshtein_distance(content, event.data.content) <= threshold) {
                    // the content has not changed significantly so it's safe to change the language
                    console.log("Changing language to", newLang)
                    changeLanguageTo(state, view.dispatch, block, newLang, true)
                } else {
                    console.log("Content has changed significantly, not setting new language")
                }
            }
        }
    }

    const plugin = EditorView.updateListener.of(update => {
        if (update.docChanged) {
            if (idleCallbackId !== null) {
                cancelIdleCallback(idleCallbackId)
                idleCallbackId = null
            }
            if (update.transactions.every(tr => tr.annotations.some(a => a.value == LANGUAGE_CHANGE))) {
                // don't run language detection if the change was triggered by a language change
                //console.log("ignoring check after language change")
                return
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
                if (block === null || block.language.auto === false) {
                    return
                }

                const content = update.state.doc.sliceString(block.content.from, block.content.to)
                if (content === "") {
                    // if content is cleared, set language to plaintext
                    const view = getView()
                    const block = getActiveNoteBlock(view.state)
                    changeLanguageTo(view.state, view.dispatch, block, "text", true)
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


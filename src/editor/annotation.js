import { Annotation } from "@codemirror/state"

export const heynoteEvent = Annotation.define()
export const LANGUAGE_CHANGE = "heynote-change"
export const CURRENCIES_LOADED = "heynote-currencies-loaded"
export const SET_CONTENT = "heynote-set-content"
export const ADD_NEW_BLOCK = "heynote-add-new-block"
export const MOVE_BLOCK = "heynote-move-block"
export const DELETE_BLOCK = "heynote-delete-block"
export const CURSOR_CHANGE = "heynote-cursor-change"
export const APPEND_BLOCK = "heynote-append-block"
export const SET_FONT = "heynote-set-font"


// This function checks if any of the transactions has the given Heynote annotation
export function transactionsHasAnnotation(transactions, annotation) {
    return transactions.some(tr => tr.annotation(heynoteEvent) === annotation)
}

export function transactionsHasHistoryEvent(transactions) {
    return transactions.some(tr => tr.isUserEvent("undo") || tr.isUserEvent("redo"))
}

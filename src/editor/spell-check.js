import { EditorView } from "@codemirror/view"

import { useHeynoteStore } from "../stores/heynote-store"
import { useSettingsStore } from "../stores/settings-store"


export function spellcheckConfig(enabled) {
    return [
        EditorView.contentAttributes.of({"spellcheck": enabled ? "true" : "false"})
    ]
}

export function toggleSpellcheck(editor) {
    return (view) => {
        const settingsStore = useSettingsStore()
        settingsStore.setSpellcheckEnabled(!settingsStore.spellcheckEnabled)
    }
}

export function enableSpellcheck(editor) {
    return (view) => {
        const settingsStore = useSettingsStore()
        settingsStore.setSpellcheckEnabled(true)
    }
}

export function disableSpellcheck(editor) {
    return (view) => {
        const settingsStore = useSettingsStore()
        settingsStore.setSpellcheckEnabled(false)
    }
}

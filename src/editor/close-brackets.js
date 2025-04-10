import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { Prec } from "@codemirror/state"
import { keymap } from "@codemirror/view"

export function getCloseBracketsExtensions() {
    return [
        closeBrackets(),
        Prec.highest(keymap.of(closeBracketsKeymap)),
    ]
}

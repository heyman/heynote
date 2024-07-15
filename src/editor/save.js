import { ViewPlugin } from "@codemirror/view"
import { debounce } from "debounce"


export const autoSaveContent = (editor, interval) => {
    const save = debounce(() => {
        //console.log("saving buffer")
        editor.save()
    }, interval);

    return ViewPlugin.fromClass(
        class {
            update(update) {
                if (update.docChanged) {
                    save()
                }
            }
        }
    )
}
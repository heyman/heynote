import { search } from "@codemirror/search"

import { createApp } from "vue"

import { highlightSelectionMatches } from "./selection-match.js"
import SearchPanel from "./SearchPanel.vue"

function createSearchPanel(view) {
    //console.log("createSearchPanel")
    const el = document.createElement("div")
    const app = createApp(SearchPanel, {
        view: view,
    })
    const vm = app.mount(el)

    return {
        dom: el,
        top: true,
        destroy() {
            app.unmount()
        },
        update(update) {
            if (update.docChanged || update.selectionSet) {
                vm.onUpdate(update)
            }
        },
    }
} 

export const heynoteSearch = [
    search({
        createPanel: createSearchPanel,
    }),
    highlightSelectionMatches(),
]

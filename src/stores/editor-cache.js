import { toRaw } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../common/note-format"

const NUM_EDITOR_INSTANCES = 5

export const useEditorCacheStore = defineStore("editorCache", {
    state: () => ({
        editorCache: {
            lru: [],
            cache: {},
        },
    }),

    actions: {
        getEditor(path) {
            // move to end of LRU
            this.editorCache.lru = this.editorCache.lru.filter(p => p !== path)
            this.editorCache.lru.push(path)

            if (this.editorCache.cache[path]) {
                return this.editorCache.cache[path]
            }
        },

        addEditor(path, editor) {
            if (this.editorCache.lru.length >= NUM_EDITOR_INSTANCES) {
                const pathToFree = this.editorCache.lru.shift()
                this.freeEditor(pathToFree)
            }

            this.editorCache.cache[path] = editor
        },

        freeEditor(pathToFree) {
            if (!this.editorCache.cache[pathToFree]) {
                return
            }
            this.editorCache.cache[pathToFree].destroy()
            delete this.editorCache.cache[pathToFree]
            this.editorCache.lru = this.editorCache.lru.filter(p => p !== pathToFree)
        },

        eachEditor(fn) {
            Object.values(toRaw(this.editorCache.cache)).forEach(fn)
        },

        clearCache(save=true) {
            console.log("Clearing editor cache")
            this.eachEditor((editor) => {
                editor.destroy(save=save)
            })
            this.editorCache.cache = {}
            this.editorCache.lru = []
        },
    },
})

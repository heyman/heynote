import { toRaw } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../common/note-format"
import { useEditorCacheStore } from "./editor-cache"
import { SCRATCH_FILE_NAME } from "../common/constants"


export const useHeynoteStore = defineStore("heynote", {
    state: () => ({
        buffers: {},
        recentBufferPaths: [SCRATCH_FILE_NAME],

        currentEditor: null,
        currentBufferPath: SCRATCH_FILE_NAME,
        currentBufferName: null,
        currentLanguage: null,
        currentLanguageAuto: null,
        currentCursorLine: null,
        currentSelectionSize: null,
        libraryId: 0,
        createBufferParams: {
            mode: "new",
            nameSuggestion: ""
        },

        showBufferSelector: false,
        showLanguageSelector: false,
        showCreateBuffer: false,
        showEditBuffer: false,
    }),

    actions: {
        async updateBuffers() {
            this.setBuffers(await window.heynote.buffer.getList())
        },

        setBuffers(buffers) {
            this.buffers = buffers
        },

        openBuffer(path) {
            this.closeDialog()
            this.currentBufferPath = path

            const recent = this.recentBufferPaths.filter((p) => p !== path)
            recent.unshift(path)
            this.recentBufferPaths = recent.slice(0, 100)
        },

        openLanguageSelector() {
            this.closeDialog()
            this.showLanguageSelector = true
        },
        openBufferSelector() {
            this.closeDialog()
            this.showBufferSelector = true
        },
        openCreateBuffer(createMode, nameSuggestion) {
            createMode = createMode || "new"
            this.closeDialog()
            this.createBufferParams = {
                mode: createMode || "new",
                name: nameSuggestion || ""
            }
            this.showCreateBuffer = true
        },
        closeDialog() {
            this.showCreateBuffer = false
            this.showBufferSelector = false
            this.showLanguageSelector = false
            this.showEditBuffer = false
        },

        closeBufferSelector() {
            this.showBufferSelector = false
        },

        editBufferMetadata(path) {
            if (this.currentBufferPath !== path) {
                this.openBuffer(path)
            }
            this.closeDialog()
            this.showEditBuffer = true
        },

        /**
         * Create a new note file at `path` with name `name` from the current block of the current open editor, 
         * and switch to it
         */
        async createNewBufferFromActiveBlock(path, name) {
            await toRaw(this.currentEditor).createNewBufferFromActiveBlock(path, name)
        },

        /**
         * Create a new empty note file at `path` with name `name`, and switch to it
         */
        async createNewBuffer(path, name) {
            await toRaw(this.currentEditor).createNewBuffer(path, name)
        },

        /**
         * Create a new note file at path, with name `name`, and content content
         * @param {*} path: File path relative to Heynote root 
         * @param {*} name Name of the note
         * @param {*} content Contents (without metadata)
         */
        async saveNewBuffer(path, name, content) {
            if (this.buffers[path]) {
                throw new Error(`Note already exists: ${path}`)
            }
            
            const note = new NoteFormat()
            note.content = content
            note.metadata.name = name
            //console.log("saving", path, note.serialize())
            await window.heynote.buffer.create(path, note.serialize())
            this.updateBuffers()
        },

        async updateBufferMetadata(path, name, newPath) {
            const editorCacheStore = useEditorCacheStore()

            if (this.currentEditor.path !== path) {
                throw new Error(`Can't update note (${path}) since it's not the active one (${this.currentEditor.path})`)
            }
            //console.log("currentEditor", this.currentEditor)
            toRaw(this.currentEditor).setName(name)
            await (toRaw(this.currentEditor)).save()
            if (newPath && path !== newPath) {
                //console.log("moving note", path, newPath)
                editorCacheStore.freeEditor(path)
                await window.heynote.buffer.move(path, newPath)
                this.openBuffer(newPath)
                this.updateBuffers()
            }
        },

        async deleteBuffer(path) {
            if (path === SCRATCH_FILE_NAME) {
                throw new Error("Can't delete scratch file")
            }
            const editorCacheStore = useEditorCacheStore()
            if (this.currentEditor.path === path) {
                this.currentEditor = null
                this.currentBufferPath = SCRATCH_FILE_NAME
            }
            editorCacheStore.freeEditor(path)
            await window.heynote.buffer.delete(path)
            await this.updateBuffers()
        },

        async reloadLibrary() {
            const editorCacheStore = useEditorCacheStore()
            await this.updateBuffers()
            editorCacheStore.clearCache(false)
            this.currentEditor = null
            this.currentBufferPath = SCRATCH_FILE_NAME
            this.libraryId++
        },
    },
})

export async function initHeynoteStore() {
    const heynoteStore = useHeynoteStore()
    window.heynote.buffer.setLibraryPathChangeCallback(() => {
        heynoteStore.reloadLibrary()
    })
    await heynoteStore.updateBuffers()
}

import { toRaw } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../editor/note-format"
import { useEditorCacheStore } from "./editor-cache"

export const SCRATCH_FILE = window.heynote.isDev ? "buffer-dev.txt" : "buffer.txt"

export const useNotesStore = defineStore("notes", {
    state: () => ({
        notes: {},
        recentNotePaths: [SCRATCH_FILE],

        currentEditor: null,
        currentNotePath: SCRATCH_FILE,
        currentNoteName: null,
        currentLanguage: null,
        currentLanguageAuto: null,
        currentCursorLine: null,
        currentSelectionSize: null,

        showNoteSelector: false,
        showLanguageSelector: false,
        showCreateNote: false,
        showEditNote: false,
    }),

    actions: {
        async updateNotes() {
            this.setNotes(await window.heynote.buffer.getList())
        },

        setNotes(notes) {
            this.notes = notes
        },

        openNote(path) {
            this.closeDialog()
            this.currentNotePath = path

            const recent = this.recentNotePaths.filter((p) => p !== path)
            recent.unshift(path)
            this.recentNotePaths = recent.slice(0, 100)
        },

        openLanguageSelector() {
            this.closeDialog()
            this.showLanguageSelector = true
        },
        openNoteSelector() {
            this.closeDialog()
            this.showNoteSelector = true
        },
        openCreateNote() {
            this.closeDialog()
            this.showCreateNote = true
        },
        closeDialog() {
            this.showCreateNote = false
            this.showNoteSelector = false
            this.showLanguageSelector = false
            this.showEditNote = false
        },

        closeNoteSelector() {
            this.showNoteSelector = false
        },

        editNote(path) {
            if (this.currentNotePath !== path) {
                this.openNote(path)
            }
            this.closeDialog()
            this.showEditNote = true
        },

        /**
         * Create a new note file at `path` with name `name` from the current block of the current open editor
         */
        async createNewNoteFromActiveBlock(path, name) {
            await toRaw(this.currentEditor).createNewNoteFromActiveBlock(path, name)
        },

        /**
         * Create a new note file at path, with name `name`, and content content
         * @param {*} path: File path relative to Heynote root 
         * @param {*} name Name of the note
         * @param {*} content Contents (without metadata)
         */
        async saveNewNote(path, name, content) {
            //window.heynote.buffer.save(path, content)
            //this.updateNotes()

            if (this.notes[path]) {
                throw new Error(`Note already exists: ${path}`)
            }
            
            const note = new NoteFormat()
            note.content = content
            note.metadata.name = name
            console.log("saving", path, note.serialize())
            await window.heynote.buffer.create(path, note.serialize())
            this.updateNotes()
        },

        async updateNoteMetadata(path, name, newPath) {
            const editorCacheStore = useEditorCacheStore()

            if (this.currentEditor.path !== path) {
                throw new Error(`Can't update note (${path}) since it's not the active one (${this.currentEditor.path})`)
            }
            console.log("currentEditor", this.currentEditor)
            toRaw(this.currentEditor).setName(name)
            await (toRaw(this.currentEditor)).save()
            if (newPath && path !== newPath) {
                console.log("moving note", path, newPath)
                editorCacheStore.freeEditor(path)
                await window.heynote.buffer.move(path, newPath)
                this.openNote(newPath)
                this.updateNotes()
            }
        },
    },
})

export async function initNotesStore() {
    const notesStore = useNotesStore()
    await notesStore.updateNotes()
}

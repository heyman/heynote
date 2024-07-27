import { toRaw } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../editor/note-format"

const SCRATCH_FILE = window.heynote.isDev ? "buffer-dev.txt" : "buffer.txt"

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
    }),

    actions: {
        async updateNotes() {
            this.setNotes(await window.heynote.buffer.getList())
        },

        setNotes(notes) {
            this.notes = notes
        },

        openNote(path) {
            this.showNoteSelector = false
            this.showLanguageSelector = false
            this.showCreateNote = false
            this.currentNotePath = path

            const recent = this.recentNotePaths.filter((p) => p !== path)
            recent.unshift(path)
            this.recentNotePaths = recent.slice(0, 100)
        },

        openLanguageSelector() {
            this.showLanguageSelector = true
            this.showNoteSelector = false
            this.showCreateNote = false
        },
        openNoteSelector() {
            this.showNoteSelector = true
            this.showLanguageSelector = false
            this.showCreateNote = false
        },
        openCreateNote() {
            this.showCreateNote = true
            this.showNoteSelector = false
            this.showLanguageSelector = false
        },
        closeDialog() {
            this.showCreateNote = false
            this.showNoteSelector = false
            this.showLanguageSelector = false
        },

        async createNewNoteFromActiveBlock(path, name) {
            await toRaw(this.currentEditor).createNewNoteFromActiveBlock(path, name)
        },

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
    },
})

export async function initNotesStore() {
    const notesStore = useNotesStore()
    await notesStore.updateNotes()
}

import { defineStore } from "pinia"

export const useNotesStore = defineStore("notes", {
    state: () => ({
        notes: {},
        currentNotePath: window.heynote.isDev ? "buffer-dev.txt" : "buffer.txt",
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

        createNewNote(path, content) {
            //window.heynote.buffer.save(path, content)
            this.updateNotes()
        },

        openNote(path) {
            this.showNoteSelector = false
            this.showLanguageSelector = false
            this.showCreateNote = false
            this.currentNotePath = path
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
    },
})

export async function initNotesStore() {
    const notesStore = useNotesStore()
    await notesStore.updateNotes()
}

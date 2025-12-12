import { toRaw, nextTick, watch } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../common/note-format"
import { useEditorCacheStore } from "./editor-cache"
import { 
    SCRATCH_FILE_NAME, WINDOW_FULLSCREEN_STATE, WINDOW_FOCUS_STATE, 
    SAVE_TABS_STATE, LOAD_TABS_STATE, CONTEXT_MENU_CLOSED 
} from "../common/constants"


export const useHeynoteStore = defineStore("heynote", {
    state: () => ({
        buffers: {},
        recentBufferPaths: [SCRATCH_FILE_NAME],
        openTabs: [],
        closedTabs: [],

        currentEditor: null,
        currentBufferPath: null,
        currentBufferName: null,
        currentLanguage: null,
        currentLanguageAuto: null,
        currentCursorLine: null,
        currentSelectionSize: null,
        currentCreatedTime: null,
        libraryId: 0,
        createBufferParams: {
            mode: "new",
            nameSuggestion: ""
        },

        showBufferSelector: false,
        showLanguageSelector: false,
        showCreateBuffer: false,
        showEditBuffer: false,
        showMoveToBufferSelector: false,
        showCommandPalette: false,

        isFullscreen: false,
        isFocused: true,
    }),

    actions: {
        async updateBuffers() {
            this.setBuffers(await window.heynote.buffer.getList())
        },

        setBuffers(buffers) {
            this.buffers = buffers
        },

        focusEditor() {
            if (!this.currentEditor) {
                return
            }
            this.currentEditor.focus()
        },

        openBuffer(path) {
            this.closeDialog()
            this.currentBufferPath = path
            this.addRecentBuffer(path)

            // add to tabs if it's not already open
            if (!this.openTabs.includes(path)) {
                this.openTabs.push(path)
            }
        },

        closeTab(path) {
            if (path === SCRATCH_FILE_NAME && this.openTabs.length === 1) {
                // don't close the scratch file if it's the only open tab
                return
            }
            const editorCacheStore = useEditorCacheStore()
            
            // add the tab being closed to the closed tabs stack with its position
            const tabIndex = this.openTabs.indexOf(path)
            this.closedTabs.unshift({ path, index: tabIndex })
            // keep only the last 10 closed tabs
            if (this.closedTabs.length > 10) {
                this.closedTabs = this.closedTabs.slice(0, 10)
            }
            
            this.openTabs = this.openTabs.filter((p) => p !== path)
            if (this.currentBufferPath === path) {
                this.currentEditor = null
                editorCacheStore.freeEditor(path)
                // if the current tab is closed, switch to the most recently used buffer that is open
                const recentBuffers = this.recentBufferPaths.filter((p) => p !== path && this.openTabs.includes(p))
                if (recentBuffers.length > 0) {
                    //console.log("opening:", recentBuffers[0])
                    this.openBuffer(recentBuffers[0])
                } else if (this.openTabs.length > 0) {
                    this.openBuffer(this.openTabs[0])
                } else {
                    this.openBuffer(SCRATCH_FILE_NAME)
                }
            } else {
                // if the current tab is not the one being closed, just free the editor
                editorCacheStore.freeEditor(path)
            }
        },

        closeCurrentTab() {
            this.closeTab(this.currentBufferPath)
        },

        switchToTabIndex(index) {
            if (index < 0 || index >= this.openTabs.length) {
                return
            }
            const path = this.openTabs[index]
            this.openBuffer(path)
        },

        switchToLastTab() {
            if (this.openTabs.length === 0) {
                return
            }
            const path = this.openTabs[this.openTabs.length - 1]
            this.openBuffer(path)
        },

        previousTab() {
            // get current tab index
            const idx = this.openTabs.indexOf(this.currentBufferPath)
            if (idx <= 0) {
                this.switchToTabIndex(this.openTabs.length - 1)
            } else {
                this.switchToTabIndex(idx - 1)
            }
        },

        nextTab() {
            // get current tab index
            const idx = this.openTabs.indexOf(this.currentBufferPath)
            if (idx === this.openTabs.length - 1) {
                this.switchToTabIndex(0)
            } else {
                this.switchToTabIndex(idx + 1)
            }
        },

        reopenLastClosedTab() {
            // find the most recent closed tab that still exists and isn't already open
            while (this.closedTabs.length > 0) {
                const closedTab = this.closedTabs.shift()
                const { path: pathToReopen, index: originalIndex } = closedTab
                if (this.buffers[pathToReopen] && !this.openTabs.includes(pathToReopen)) {
                    // insert the tab at its original position (or as close as possible)
                    const insertIndex = Math.min(originalIndex, this.openTabs.length)
                    this.openTabs.splice(insertIndex, 0, pathToReopen)
                    this.currentBufferPath = pathToReopen
                    this.addRecentBuffer(pathToReopen)
                    return
                }
            }
        },

        getBufferTitle(path) {
            if (this.buffers[path]) {
                return this.buffers[path].name || path
            }
            return path
        },

        addRecentBuffer(path) {
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
        openCommandPalette() {
            this.closeDialog()
            this.showCommandPalette = true
        },
        openMoveToBufferSelector() {
            this.closeDialog()
            this.showMoveToBufferSelector = true
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
            this.showMoveToBufferSelector = false
            this.showCommandPalette = false
        },

        closeBufferSelector() {
            this.showBufferSelector = false
            this.showCommandPalette = false
        },

        closeMoveToBufferSelector() {
            this.showMoveToBufferSelector = false
        },

        editBufferMetadata(path) {
            if (path === SCRATCH_FILE_NAME) {
                throw new Error("Can't edit scratch file metadata")
            }
            if (this.currentBufferPath !== path) {
                this.openBuffer(path)
            }
            this.closeDialog()
            this.showEditBuffer = true
        },


        executeCommand(command) {
            if (this.currentEditor) {
                toRaw(this.currentEditor).executeCommand(command)
            }
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
                this.closeTab(path)
                await window.heynote.buffer.move(path, newPath)
                this.openBuffer(newPath)
            }
            this.updateBuffers()
        },

        async deleteBuffer(path) {
            if (path === SCRATCH_FILE_NAME) {
                throw new Error("Can't delete scratch file")
            }
            const editorCacheStore = useEditorCacheStore()
            editorCacheStore.freeEditor(path)
            this.recentBufferPaths = this.recentBufferPaths.filter((p) => p !== path)
            this.openTabs = this.openTabs.filter((p) => p !== path)
            this.closedTabs = this.closedTabs.filter((closedTab) => closedTab.path !== path)

            // if the active buffer is deleted, we need to select a new tab
            if (this.currentEditor.path === path) {
                this.currentEditor = null
                const recentBuffers = this.recentBufferPaths.filter((p) => p !== path && this.openTabs.includes(p))
                if (recentBuffers.length > 0) {
                    this.openBuffer(recentBuffers[0])
                } else if (this.openTabs.length > 0) {
                    this.openBuffer(this.openTabs[0])
                } else {
                    this.currentBufferPath = SCRATCH_FILE_NAME
                    this.openBuffer(SCRATCH_FILE_NAME)
                }
            }

            await window.heynote.buffer.delete(path)
            await this.updateBuffers()
        },

        async reloadLibrary() {
            const editorCacheStore = useEditorCacheStore()
            await this.updateBuffers()
            editorCacheStore.clearCache(false)
            this.currentEditor = null
            this.openTabs = []
            this.recentBufferPaths = []
            this.openBuffer(SCRATCH_FILE_NAME)
            this.libraryId++
        },

        async saveTabsState() {
            //console.log("saving tabs state", this.currentBufferPath, this.openTabs)
            await window.heynote.mainProcess.invoke(SAVE_TABS_STATE, {
                currentBufferPath: this.currentBufferPath,
                openTabs: toRaw(this.openTabs),
                recentBuffers: toRaw(this.recentBufferPaths),
            })
        },
        
        async loadTabsState() {
            // this function 
            const state = await window.heynote.mainProcess.invoke(LOAD_TABS_STATE)
            //console.log("tabs state:", state)

            if (!!state) {
                // make sure all open tabs still exist
                this.openTabs = state.openTabs?.filter((path) => this.buffers[path]) || []
                this.recentBufferPaths = state.recentBuffers?.filter((path) => this.buffers[path]) || [SCRATCH_FILE_NAME]

                if (this.buffers[state.currentBufferPath]) {
                    this.openBuffer(state.currentBufferPath)
                } else {
                    this.openBuffer(SCRATCH_FILE_NAME)
                }
            } else {
                // no saved state, just open the scratch file
                //console.log("No saved tabs state, opening scratch file")
                this.openBuffer(SCRATCH_FILE_NAME)
            }
        },
    },
})

export async function initHeynoteStore() {
    const heynoteStore = useHeynoteStore()
    window.heynote.buffer.setLibraryPathChangeCallback(() => {
        heynoteStore.reloadLibrary()
    })
    window.heynote.mainProcess.on(WINDOW_FULLSCREEN_STATE, (event, state) => {
        heynoteStore.isFullscreen = state
        document.documentElement.setAttribute("fullscreen", state ? "true" : "false")
    })
    window.heynote.mainProcess.on(WINDOW_FOCUS_STATE, (event, state) => {
        heynoteStore.isFocused = state
    })
    await heynoteStore.updateBuffers()
    heynoteStore.loadTabsState()

    window.heynote.mainProcess.on(CONTEXT_MENU_CLOSED, (event) => {
        heynoteStore.focusEditor()
    })

    watch(() => heynoteStore.currentBufferPath, () => heynoteStore.saveTabsState())
    watch(() => heynoteStore.openTabs, () => heynoteStore.saveTabsState())
}

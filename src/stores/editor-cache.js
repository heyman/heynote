import { toRaw, watch } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../common/note-format"

import { useSettingsStore } from './settings-store'
import { useErrorStore } from './error-store'
import { useHeynoteStore } from './heynote-store'
import { HeynoteEditor } from '../editor/editor'

// keep max 5 editor instances that are stale in memory
const NUM_EDITOR_INSTANCES = 5
// always keep an editor in memory if it was accessed in the last hour
const EDITOR_STALE_TIME = 1000 * 3600

export const useEditorCacheStore = defineStore("editorCache", {
    state: () => ({
        lru: [],
        accessTimes: {},
        cache: {},
        watchHandler: null,
        themeWatchHandler: null,
        containerElement: null,
        cleanupTimer: null,
    }),

    actions: {
        _createEditorInstance(path) {
            const settingsStore = useSettingsStore()
            const errorStore = useErrorStore()
            let editor
            try {
                editor = new HeynoteEditor({
                    element: this.containerElement,
                    path: path,
                    theme: settingsStore.theme,
                    keymap: settingsStore.settings.keymap,
                    emacsMetaKey: settingsStore.settings.emacsMetaKey,
                    showLineNumberGutter: settingsStore.settings.showLineNumberGutter,
                    showFoldGutter: settingsStore.settings.showFoldGutter,
                    bracketClosing: settingsStore.settings.bracketClosing,
                    fontFamily: settingsStore.settings.fontFamily,
                    fontSize: settingsStore.settings.fontSize,
                    indentType: settingsStore.settings.indentType,
                    tabSize: settingsStore.settings.tabSize,
                    defaultBlockToken: settingsStore.settings.defaultBlockLanguage,
                    defaultBlockAutoDetect: settingsStore.settings.defaultBlockLanguageAutoDetect,
                    keyBindings: settingsStore.settings.keyBindings,
                })
            } catch (e) {
                errorStore.addError("Error! " + e.message)
                throw e
            }

            return editor
        },

        getOrCreateEditor(path) {
            if (this.cache[path]) {
                this.updateLru(path)
                this.freeStaleEditors()
                return [this.cache[path], false]
            } else {
                const editor = this._createEditorInstance(path)
                this.cache[path] = editor

                // add the editor to the LRU
                this.updateLru(path)

                this.freeStaleEditors()
                return [editor, true]
            }
        },

        updateLru(path, addLast=false) {
            this.lru = this.lru.filter(p => p !== path)
            if (addLast) {
                // add to LRU, but as the first item to be removed
                this.lru.unshift(path)
                this.accessTimes[path] = new Date((new Date())-(3600*24*365*1000))
            } else {
                this.lru.push(path)
                this.accessTimes[path] = Date.now()
            }
        },

        freeEditor(pathToFree) {
            //console.log("Freeing:", pathToFree)
            if (!this.cache[pathToFree]) {
                return
            }
            this.cache[pathToFree].destroy()
            delete this.cache[pathToFree]
            this.lru = this.lru.filter(p => p !== pathToFree)
            delete this.accessTimes[pathToFree]
        },

        freeStaleEditors() {
            let pathsToFree = []
            for (let i=0; i<this.lru.length-NUM_EDITOR_INSTANCES; i++) {
                let path = this.lru[i]
                if (Date.now() - this.accessTimes[path] > EDITOR_STALE_TIME) {
                    pathsToFree.push(path)
                }
            }

            // Debug LRU
            //console.log("--- LRU ---")
            //for (let i=0; i<this.lru.length; i++) {
            //    let path = this.lru[i]
            //    if (pathsToFree.includes(path)) {
            //        console.log("---", path)
            //    } else if (i < this.lru.length - NUM_EDITOR_INSTANCES) {
            //        console.log("*  ", path, i)
            //    } else {
            //        console.log("    ", path)
            //    }
            //}
            //console.log("")

            for (let path of pathsToFree) {
                this.freeEditor(path)
            }
        },

        eachEditor(fn) {
            Object.values(toRaw(this.cache)).forEach(fn)
        },

        clearCache(save=true) {
            console.log("Clearing editor cache")
            this.eachEditor((editor) => {
                editor.destroy(save=save)
            })
            this.cache = {}
            this.accessTimes = {}
            this.lru = []
        },

        onCurrenciesLoaded() {
            this.eachEditor((editor) => {
                editor.currenciesLoaded()
            })
        },

        setUp(containerElement) {
            this.containerElement = containerElement
            const settingsStore = useSettingsStore()
            this.watchHandler = watch(() => settingsStore.settings, (newSettings, oldSettings) => {
                //console.log("Settings changed (watch)", newSettings, oldSettings)
                const changedKeys = Object.keys(newSettings).filter(key => newSettings[key] !== oldSettings[key])

                for (const key of changedKeys) {
                    this.eachEditor((editor) => {
                        switch (key) {
                            case "keymap":
                            case "emacsMetaKey":
                            case "keyBindings":
                                editor.setKeymap(newSettings.keymap, newSettings.emacsMetaKey, newSettings.keyBindings)
                                break
                            case "showLineNumberGutter":
                                editor.setLineNumberGutter(newSettings.showLineNumberGutter)
                                break
                            case "showFoldGutter":
                                editor.setFoldGutter(newSettings.showFoldGutter)
                                break
                            case "bracketClosing":
                                editor.setBracketClosing(newSettings.bracketClosing)
                                break
                            case "fontFamily":
                            case "fontSize":
                                editor.setFont(newSettings.fontFamily, newSettings.fontSize)
                                break
                            case "indentType":
                            case "tabSize":
                                editor.setIndentSettings(newSettings.indentType, newSettings.tabSize)
                                break
                            case "defaultBlockLanguage":
                            case "defaultBlockLanguageAutoDetect":
                                editor.setDefaultBlockLanguage(newSettings.defaultBlockLanguage, newSettings.defaultBlockLanguageAutoDetect)
                                break
                        }
                    })
                }
            })

            this.themeWatchHandler = watch(() => settingsStore.theme, (theme) => {
                this.eachEditor((editor) => {
                    editor.setTheme(theme)
                })
            })

            this.cleanupTimer = setInterval(() => {
                this.freeStaleEditors()
            }, 1000 * 60 * 10) // every 10 minutes

            window.document.addEventListener("currenciesLoaded", this.onCurrenciesLoaded)
        },

        tearDown() {
            if (this.watchHandler) {
                this.watchHandler()
            }
            if (this.themeWatchHandler) {
                this.themeWatchHandler()
            }
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer)
                this.cleanupTimer = null
            }

            window.document.removeEventListener("currenciesLoaded", this.onCurrenciesLoaded)

            this.lru = []
            this.cache = {}
        },

        moveCurrentBlockToOtherEditor(targetPath) {
            const heynoteStore = useHeynoteStore()
            const editor = toRaw(this.cache[heynoteStore.currentBufferPath])
            let [otherEditor, created] = this.getOrCreateEditor(targetPath)
            otherEditor = toRaw(otherEditor)
            otherEditor.hide()

            const content = editor.getActiveBlockContent()
            otherEditor.contentLoadedPromise.then(() => {
                otherEditor.appendBlockContent(content)
                editor.deleteActiveBlock()

                // add the target buffer to recent buffers so that it shows up at the top of the buffer selector
                heynoteStore.addRecentBuffer(targetPath)
                heynoteStore.addRecentBuffer(heynoteStore.currentBufferPath)

                // if otherEditor was just created, we can move it to the end of the LRU so that it's the first to be cleaned up
                if (created) {
                    this.updateLru(targetPath, true)
                }
            })

            //console.log("LRU", this.lru)
        }
    },
})

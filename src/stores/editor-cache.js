import { toRaw, watch } from 'vue';
import { defineStore } from "pinia"
import { NoteFormat } from "../common/note-format"

import { useSettingsStore } from './settings-store'
import { useErrorStore } from './error-store'
import { HeynoteEditor } from '../editor/editor'

const NUM_EDITOR_INSTANCES = 5

export const useEditorCacheStore = defineStore("editorCache", {
    state: () => ({
        editorCache: {
            lru: [],
            cache: {},
            watchHandler: null,
            themeWatchHandler: null,
        },
    }),

    actions: {
        createEditor(path, element) {
            const settingsStore = useSettingsStore()
            const errorStore = useErrorStore()
            try {
                return new HeynoteEditor({
                    element: element,
                    path: path,
                    theme: settingsStore.theme,
                    keymap: settingsStore.settings.keymap,
                    emacsMetaKey: settingsStore.settings.emacsMetaKey,
                    showLineNumberGutter: settingsStore.settings.showLineNumberGutter,
                    showFoldGutter: settingsStore.settings.showFoldGutter,
                    bracketClosing: settingsStore.settings.bracketClosing,
                    fontFamily: settingsStore.settings.fontFamily,
                    fontSize: settingsStore.settings.fontSize,
                    defaultBlockToken: settingsStore.settings.defaultBlockLanguage,
                    defaultBlockAutoDetect: settingsStore.settings.defaultBlockLanguageAutoDetect,
                })
            } catch (e) {
                errorStore.addError("Error! " + e.message)
                throw e
            }
        },

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

        onCurrenciesLoaded() {
            this.eachEditor((editor) => {
                editor.currenciesLoaded()
            })
        },

        setUp() {
            const settingsStore = useSettingsStore()
            this.watchHandler = watch(() => settingsStore.settings, (newSettings, oldSettings) => {
                //console.log("Settings changed (watch)", newSettings, oldSettings)
                const changedKeys = Object.keys(newSettings).filter(key => newSettings[key] !== oldSettings[key])

                for (const key of changedKeys) {
                    this.eachEditor((editor) => {
                        switch (key) {
                            case "keymap":
                            case "emacsMetaKey":
                                editor.setKeymap(newSettings.keymap, newSettings.emacsMetaKey)
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

            window.document.addEventListener("currenciesLoaded", this.onCurrenciesLoaded)
        },

        tearDown() {
            if (this.watchHandler) {
                this.watchHandler()
            }
            if (this.themeWatchHandler) {
                this.themeWatchHandler()
            }

            window.document.removeEventListener("currenciesLoaded", this.onCurrenciesLoaded)
        },
    },
})

<script>
    import { syntaxTree } from "@codemirror/language"
    import { toRaw } from 'vue';
    import { mapState, mapWritableState, mapActions, mapStores } from 'pinia'
    import { useErrorStore } from "../stores/error-store"
    import { useHeynoteStore } from "../stores/heynote-store.js"
    import { useEditorCacheStore } from "../stores/editor-cache"
    import { REDO_EVENT, WINDOW_CLOSE_EVENT } from '@/src/common/constants';

    const NUM_EDITOR_INSTANCES = 5

    export default {
        props: {
            development: Boolean,
            debugSyntaxTree: Boolean,
        },

        components: {},

        data() {
            return {
                syntaxTreeDebugContent: null,
                editor: null,
                onWindowClose: null,
                onRedo: null,
            }
        },

        mounted() {
            // initialize editorCacheStore (sets up watchers for settings changes, propagating them to all editors)
            this.editorCacheStore.setUp(this.$refs.editor);

            this.loadBuffer(this.currentBufferPath)

            // set up window close handler that will save the buffer and quit
            this.onWindowClose = () => {
                window.heynote.buffer.saveAndQuit([
                    [this.editor.path, this.editor.getContent()],
                ])
            }

            this.onRedo = () => {
                if (this.editor) {
                    toRaw(this.editor).redo()
                }
            }
            
            window.heynote.mainProcess.on(WINDOW_CLOSE_EVENT, this.onWindowClose)
            window.heynote.mainProcess.on(REDO_EVENT, this.onRedo)

            // if debugSyntaxTree prop is set, display syntax tree for debugging
            if (this.debugSyntaxTree) {
                setInterval(() => {
                    function render(tree) {
                        let lists = ''
                        tree.iterate({
                            enter(type) {
                                lists += `<ul><li>${type.name} (${type.from},${type.to})`
                            },
                            leave() {
                                lists += '</ul>'
                            }
                        })
                        return lists
                    }
                    this.syntaxTreeDebugContent = render(syntaxTree(this.editor.view.state))
                }, 1000)
            }
        },

        beforeUnmount() {
            window.heynote.mainProcess.off(WINDOW_CLOSE_EVENT, this.onWindowClose)
            window.heynote.mainProcess.off(REDO_EVENT, this.onRedo)
            this.editorCacheStore.tearDown();
        },

        watch: {
            loadNewEditor() {
                //console.log("currentBufferPath changed to", path)
                this.loadBuffer(this.currentBufferPath)
            },
        },

        computed: {
            ...mapStores(useEditorCacheStore),
            ...mapState(useHeynoteStore, [
                "currentBufferPath",
                "libraryId",
            ]),
            ...mapWritableState(useHeynoteStore, [
                "currentEditor",
                "currentBufferName",
            ]),

            loadNewEditor() {
                return `${this.currentBufferPath}|${this.libraryId}`
            },
        },

        methods: {
            loadBuffer(path) {
                //console.log("loadBuffer", path)
                if (this.editor) {
                    this.editor.hide()
                }

                let cachedEditor = this.editorCacheStore.getEditor(path)
                if (cachedEditor) {
                    //console.log("show cached editor")
                    this.editor = cachedEditor
                    toRaw(this.editor).show()
                } else {
                    //console.log("create new editor")
                    this.editor = this.editorCacheStore.createEditor(path)
                    this.editorCacheStore.addEditor(path, toRaw(this.editor))
                }

                this.currentEditor = toRaw(this.editor)
                window._heynote_editor = toRaw(this.editor)
            },

            setLanguage(language) {
                const editor = toRaw(this.editor)
                if (language === "auto") {
                    editor.setCurrentLanguage(null, true)
                } else {
                    editor.setCurrentLanguage(language, false)
                }
                editor.focus()
            },

            formatCurrentBlock() {
                const editor = toRaw(this.editor)
                editor.formatCurrentBlock()
                editor.focus()
            },

            focus() {
                toRaw(this.editor).focus()
            },
        },
    }
</script>

<template>
    <div>
        <div class="editor" ref="editor"></div>
        <div 
            v-if="debugSyntaxTree"
            v-html="syntaxTreeDebugContent"
            class="debug-syntax-tree"
        ></div>
    </div>
</template>

<style lang="sass" scoped>
    .debug-syntax-tree
        position: absolute
        top: 0
        bottom: 0
        right: 0
        width: 50%
        background-color: rgba(240, 240, 240, 0.85)
        color: #000
        font-size: 12px
        font-family: monospace
        padding: 10px
        overflow: auto

        ul
            padding-left: 20px
        > ul
            padding-left: 0
</style>

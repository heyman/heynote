<script>
    import fuzzysort from 'fuzzysort'
    import { toRaw } from 'vue'
    import { mapState, mapActions } from 'pinia'
    import { useHeynoteStore } from "../stores/heynote-store"
    import { LANGUAGES } from '../editor/languages.js'

    const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES.map(l => [l.token, l.name]))

    function escapeHtml(text) {
        if (!text) return text
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }

    export default {
        data() {
            return {
                filter: "",
                selected: 0,
            }
        },

        mounted() {
            this.$nextTick(() => {
                this.$refs.input?.focus()
            })
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "currentBlocks",
                "currentEditor",
            ]),

            filteredBlocks() {
                if (this.filter === "") {
                    return this.currentBlocks.map(block => ({
                        ...block,
                        escapedPreview: escapeHtml(block.preview)
                    }))
                }
                const searchResults = fuzzysort.go(this.filter, this.currentBlocks, {
                    keys: ['preview'],
                    threshold: -10000,
                })
                return searchResults.map((result) => {
                    const obj = {...result.obj}
                    const previewHighlight = result[0]?.highlight("<b>", "</b>")
                    // Escape HTML but preserve the <b> tags from fuzzysort highlight
                    if (previewHighlight) {
                        // First escape the original preview, then apply highlight positions
                        obj.highlightedPreview = escapeHtml(obj.preview)
                        // Re-apply highlighting to escaped text by using fuzzysort on escaped version
                        const escapedResult = fuzzysort.single(this.filter, obj.highlightedPreview)
                        obj.highlightedPreview = escapedResult?.highlight("<b>", "</b>") || obj.highlightedPreview
                    } else {
                        obj.highlightedPreview = escapeHtml(obj.preview)
                    }
                    return obj
                })
            },
        },

        watch: {
            currentBlocks() {
                if (this.selected >= this.currentBlocks.length) {
                    this.selected = Math.max(0, this.currentBlocks.length - 1)
                }
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, ['closeBlockOutline']),

            getLanguageName(token) {
                return LANGUAGE_NAMES[token] || token
            },

            onKeydown(event) {
                if (event.key === "ArrowDown") {
                    if (this.selected === this.filteredBlocks.length - 1) {
                        this.selected = 0
                    } else {
                        this.selected = Math.min(this.selected + 1, this.filteredBlocks.length - 1)
                    }
                    event.preventDefault()
                    this.scrollToSelected()
                } else if (event.key === "ArrowUp") {
                    if (this.selected === 0) {
                        this.selected = this.filteredBlocks.length - 1
                    } else {
                        this.selected = Math.max(this.selected - 1, 0)
                    }
                    event.preventDefault()
                    this.scrollToSelected()
                } else if (event.key === "Enter") {
                    if (this.filteredBlocks.length > 0) {
                        this.jumpToBlock(this.filteredBlocks[this.selected])
                    }
                    event.preventDefault()
                } else if (event.key === "Escape") {
                    this.closeBlockOutline()
                    this.$nextTick(() => {
                        const heynoteStore = useHeynoteStore()
                        heynoteStore.focusEditor()
                    })
                    event.preventDefault()
                }
            },

            jumpToBlock(block) {
                const heynoteStore = useHeynoteStore()
                if (heynoteStore.currentEditor) {
                    const editor = toRaw(heynoteStore.currentEditor)
                    editor.view.dispatch({
                        selection: { anchor: block.contentFrom },
                        scrollIntoView: true
                    })
                    editor.view.focus()
                }
            },

            scrollToSelected() {
                this.$nextTick(() => {
                    const items = this.$refs.item
                    if (items && items[this.selected]) {
                        items[this.selected].scrollIntoView({ block: "nearest" })
                    }
                })
            },

            onInput() {
                this.selected = 0
            },

            onItemClick(block, idx) {
                this.selected = idx
                this.jumpToBlock(block)
            },
        },
    }
</script>

<template>
    <div class="block-outline-panel">
        <div class="panel-header">
            <input
                type="text"
                ref="input"
                v-model="filter"
                @keydown="onKeydown"
                @input="onInput"
                placeholder="Filter blocks..."
                autocomplete="off"
                spellcheck="false"
            />
        </div>
        <ul class="block-list" ref="list">
            <li
                v-for="(block, idx) in filteredBlocks"
                :key="block.index"
                :class="{ selected: idx === selected }"
                @click="onItemClick(block, idx)"
                ref="item"
            >
                <span class="language-badge">
                    {{ getLanguageName(block.language.name) }}
                    <span v-if="block.language.auto" class="auto">(auto)</span>
                </span>
                <span
                    class="preview"
                    v-html="block.highlightedPreview || block.escapedPreview || '(empty)'"
                />
            </li>
        </ul>
    </div>
</template>

<style scoped lang="sass">
    .block-outline-panel
        display: flex
        flex-direction: column
        height: 100%
        width: 250px
        flex-shrink: 0
        background: #f5f5f5
        border-left: 1px solid #ddd
        font-size: 12px
        +dark-mode
            background: #1e1e1e
            border-left-color: #333

        .panel-header
            padding: 8px
            border-bottom: 1px solid #ddd
            +dark-mode
                border-bottom-color: #333

            input
                width: 100%
                padding: 4px 8px
                background: #fff
                border: 1px solid #ccc
                border-radius: 3px
                font-size: 12px
                box-sizing: border-box
                &:focus
                    outline: none
                    border: 1px solid #fff
                    outline: 2px solid #48b57e
                +dark-mode
                    background: #3b3b3b
                    color: rgba(255,255,255, 0.9)
                    border: 1px solid #5a5a5a
                    &:focus
                        border: 1px solid #3b3b3b

        .block-list
            flex: 1
            overflow-y: auto
            margin: 0
            padding: 0
            list-style: none

            > li
                padding: 8px 10px
                cursor: pointer
                border-bottom: 1px solid #eee
                +dark-mode
                    border-bottom-color: #2a2a2a
                    color: rgba(255,255,255, 0.7)

                &:hover
                    background: #e8e8e8
                    +dark-mode
                        background: #2a2a2a

                &.selected
                    background: #48b57e
                    color: #fff
                    +dark-mode
                        background: #1b6540

                    .language-badge
                        background: rgba(255,255,255, 0.2)
                        color: #fff

                    .preview
                        color: rgba(255,255,255, 0.9)

                .language-badge
                    display: inline-block
                    font-size: 10px
                    font-weight: 600
                    padding: 2px 6px
                    background: #e0e0e0
                    border-radius: 3px
                    margin-bottom: 4px
                    text-transform: uppercase
                    +dark-mode
                        background: #3a3a3a
                        color: rgba(255,255,255, 0.8)

                    .auto
                        font-weight: normal
                        opacity: 0.7
                        text-transform: lowercase

                .preview
                    display: block
                    font-size: 11px
                    font-family: "SF Mono", Monaco, Menlo, Consolas, monospace
                    color: #666
                    white-space: pre-wrap
                    overflow: hidden
                    max-height: 48px
                    line-height: 1.4
                    word-break: break-word
                    +dark-mode
                        color: rgba(255,255,255, 0.5)

                    ::v-deep(b)
                        font-weight: 700
                        color: #333
                        +dark-mode
                            color: #fff
</style>

<script>
    import { mapState, mapStores, mapWritableState } from "pinia"

    import { useSearchStore } from '@/src/stores/search-store';
    import { useHeynoteStore } from "@/src/stores/heynote-store";
    import { useSettingsStore } from "@/src/stores/settings-store.js";
    import { isLibrarySearchQueryLongEnough } from "@/src/common/library-search-query.js";
    import InputToggle from '@/src/editor/search/InputToggle.vue';
    import SearchResult from "./SearchResult.vue";

    export default {
        components: {
            InputToggle,
            SearchResult,
        },

        data() {
            return {
                query: "",
            }
        },

        mounted() {
            this.searchStore.initializeSearchListeners()
            this.query = this.searchStore.query
            this.focusInput()
        },

        beforeUnmount() {
            this.searchStore.cancelActiveSearch()
        },

        watch: {
            query() {
                this.search()
            },
            caseSensitive() {
                this.persistLibrarySearchSettings()
                this.search()
            },
            wholeWord() {
                this.persistLibrarySearchSettings()
                this.search()
            },
            regexp() {
                this.persistLibrarySearchSettings()
                this.search()
            },
            librarySearchFocusRequestId() {
                this.focusInput()
            },
        },

        computed: {
            ...mapStores(useSearchStore, useHeynoteStore, useSettingsStore),
            ...mapState(useSearchStore, [
                "results",
                "error",
            ]),
            ...mapState(useHeynoteStore, [
                "librarySearchFocusRequestId",
            ]),
            ...mapWritableState(useSearchStore, [
                "caseSensitive",
                "wholeWord",
                "regexp",
            ]),

            hasSearchQuery() {
                return isLibrarySearchQueryLongEnough(this.query)
            },

            resultCount() {
                return this.results.reduce((count, result) => count + result.matches.length, 0)
            },

            bufferCount() {
                return this.results.length
            },
        },

        methods: {
            persistLibrarySearchSettings() {
                this.settingsStore.updateSettings({
                    librarySearchSettings: {
                        ...(this.settingsStore.settings.librarySearchSettings || {}),
                        caseSensitive: this.caseSensitive,
                        wholeWord: this.wholeWord,
                        regexp: this.regexp,
                    },
                })
            },

            search() {
                this.searchStore.search(this.query)
            },

            focusInput() {
                this.$nextTick(() => {
                    this.$refs.input?.focus()
                })
            },

            focusFirstResult() {
                this.$nextTick(() => {
                    const row = this.resultRows()[0]
                    if (row) {
                        this.selectRow(row)
                        this.focusResults()
                    }
                })
            },

            onInputKeyDown(event) {
                if (event.key !== "ArrowDown") {
                    return
                }
                event.preventDefault()
                this.focusFirstResult()
            },

            resultRows() {
                return [...(this.$refs.results?.querySelectorAll(".search-result-row") || [])]
            },

            selectedRow() {
                return this.$refs.results?.querySelector(".search-result-row.selected")
            },

            selectRow(row) {
                if (!row) {
                    return
                }

                if (row.dataset.rowType === "buffer") {
                    this.searchStore.selectBuffer(row.dataset.buffer)
                } else if (row.dataset.rowType === "match") {
                    this.searchStore.selectMatch({
                        buffer: row.dataset.buffer,
                        lineNumber: Number(row.dataset.lineNumber),
                        line: row.dataset.line,
                    })
                }
                row.scrollIntoView({
                    behavior: "auto",
                    block: "nearest",
                })
            },

            focusResults() {
                this.$refs.results?.focus({ preventScroll: true })
            },

            moveSelectedRow(direction) {
                const rows = this.resultRows()
                if (rows.length === 0) {
                    return
                }
                const currentIndex = rows.indexOf(this.selectedRow())
                const nextIndex = currentIndex === -1
                    ? 0
                    : Math.max(0, Math.min(rows.length - 1, currentIndex + direction))
                this.selectRow(rows[nextIndex])
            },

            activateSelectedRow() {
                this.selectedRow()?.click()
            },

            setSelectedBufferOpen(open) {
                const row = this.selectedRow()
                if (!row || row.dataset.rowType !== "buffer") {
                    return
                }
                if (row.classList.contains("open") !== open) {
                    row.click()
                }
            },

            onResultsKeyDown(event) {
                if (event.key === "Escape") {
                    event.preventDefault()
                    event.stopPropagation()
                    this.closeFromEscape()
                    return
                }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault()
                    this.moveSelectedRow(event.key === "ArrowDown" ? 1 : -1)
                    return
                }
                if (event.key === "ArrowRight") {
                    event.preventDefault()
                    this.setSelectedBufferOpen(true)
                    return
                }
                if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    this.setSelectedBufferOpen(false)
                    return
                }
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    this.activateSelectedRow()
                }
            },

            closeFromEscape() {
                this.heynoteStore.closeLibrarySearchFromEscape()
            },
        },
    }
</script>

<template>
    <div class="search-container">
        <header class="header">
            <div class="input-container">
                <input
                    type="text"
                    v-model="query"
                    ref="input"
                    placeholder="Find…"
                    class="search-query"
                    main-field
                    @keydown="onInputKeyDown"
                    @keydown.esc.prevent.stop="closeFromEscape"
                />
                <div class="input-buttons">
                    <InputToggle 
                        v-model="caseSensitive" 
                        type="case-sensitive"
                    />
                    <InputToggle 
                        v-model="wholeWord" 
                        type="whole-words"
                    />
                    <InputToggle 
                        v-model="regexp" 
                        type="regex"
                    />
                </div>
            </div>
            <div v-if="error" class="search-error">
                {{ error }}
            </div>
            <div v-if="hasSearchQuery" class="result-summary">
                <b>{{ resultCount }}</b> results in <b>{{ bufferCount }}</b> buffers
            </div>
        </header>
        <div
            class="results"
            ref="results"
            tabindex="0"
            @keydown="onResultsKeyDown"
        >
            <SearchResult
                v-for="result in results"
                :key="result.buffer"
                :result="result"
                :query="query"
                :caseSensitive="caseSensitive"
            />
        </div>
    </div>
</template>

<style lang="sass" scoped>
    .search-container
        --search-indent-guide-opacity: 0
        font-size: 13px
        padding: 0px
        padding-top: 4px
        display: flex
        flex-direction: column
        height: 100%
        &:hover
            --search-indent-guide-opacity: 1

        .header
            padding: 0 8px 0 10px
            .result-summary
                margin-top: 8px
                padding: 0 1px
                font-size: 12px
                line-height: 16px
                color: rgba(0,0,0, 0.55)
                +dark-mode
                    color: rgba(255,255,255, 0.55)
                b
                    color: rgba(0,0,0, 0.8)
                    +dark-mode
                        color: rgba(255,255,255, 0.8)
            .search-error
                margin-top: 8px
                padding: 0 1px
                font-size: 12px
                line-height: 16px
                color: #b42318
                +dark-mode
                    color: #ffb4ab
            .input-container
                position: relative
                flex-grow: 1

                input[type="text"]
                    background: #fff
                    padding: 6px 5px
                    border: 1px solid #ccc
                    box-sizing: border-box
                    border-radius: 3px
                    width: 100%
                    padding-right: 74px
                    &:focus
                        outline: none
                        border: 1px solid #fff
                        outline: 2px solid #48b57e
                        border-radius: 2px
                    &::placeholder
                        color: rgba(0,0,0, 0.6)
                    +dark-mode
                        background: #3b3b3b
                        color: rgba(255,255,255, 0.9)
                        border: 1px solid #4c4c4c
                        &:focus
                            border: 1px solid #3b3b3b
                        &::placeholder
                            color: rgba(255,255,255, 0.6)
                    +webapp-mobile
                        font-size: 16px
                        max-width: 100%
                
                .input-buttons
                    position: absolute
                    top: 0
                    right: 2px
                    bottom: 0
                    display: flex
                    align-items: center
        
        .results
            padding-top: 12px
            overflow-y: scroll
            height: 100%
            &:focus
                outline: none
                :deep(.search-result-row.selected)
                    outline: 1px solid #48b57e
                    outline-offset: -1px
                    z-index: 1

    :global(.left-panel:hover) .search-container
        --search-indent-guide-opacity: 1
</style>

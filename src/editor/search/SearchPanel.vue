<script>
    import { runScopeHandlers } from "@codemirror/view"
    import { 
        closeSearchPanel,
        findNext,
        findPrevious,
        getSearchQuery,
        replaceAll,
        replaceNext,
        SearchQuery,
        selectMatches,
        setSearchQuery,
    } from "@codemirror/search"
    import { mapStores } from 'pinia'
    import { useSettingsStore } from "@/src/stores/settings-store.js"
    import { getActiveNoteBlock } from "../block/block.js"
    import InputToggle from "./InputToggle.vue"
    import { delimiterRegexWithoutNewline } from "../block/block.js"
    import { heynoteEvent, SEARCH_SETTINGS_UPDATED } from "../annotation.js"
    import { searchTestFunction } from "./search-match-filter.js"

    export default {
        name: "SearchPanel",
        props: [
            "view",
        ],

        data() {
            const query = getSearchQuery(this.view.state)
            return {
                queryStr: query.search,
                caseSensitive: false,
                regexp: false,
                wholeWord: false,
                onlyCurrentBlock: true,
                currentBlock: getActiveNoteBlock(this.view.state),
                replaceVisible: false,
                replaceStr: query.replace,
            };
        },

        mounted() {
            if (this.settingsStore.settings.searchSettings) {
                this.caseSensitive = this.settingsStore.settings.searchSettings.caseSensitive
                this.regexp = this.settingsStore.settings.searchSettings.regexp
                this.wholeWord = this.settingsStore.settings.searchSettings.wholeWord
                this.onlyCurrentBlock = this.settingsStore.settings.searchSettings.onlyCurrentBlock
            }

            this.$nextTick(() => {
                this.$refs.input.focus()
                this.$refs.input.select()
                this.search()
            });
        },

        beforeUnmount() {
            //console.log("SearchPanel beforeUnmount")
        },

        computed: {
            ...mapStores(useSettingsStore),

            searchParams() {
                return [
                    this.queryStr,
                    this.replaceStr,
                ]
            },

            ctrlCmdCharacter() {
                return window.heynote.platform.isMac ? "⌘" : "Ctrl"
            },
        },

        watch: {
            searchParams() {
                this.search()
            },
        },

        methods: {
            search() {
                let query = new SearchQuery({
                    search: this.queryStr,
                    caseSensitive: this.caseSensitive,
                    regexp: this.regexp,
                    wholeWord: this.wholeWord,
                    literal: true,
                    test: (matchedStr, state, from, to) => {
                        const line = state.doc.lineAt(from)
                        return searchTestFunction(this.onlyCurrentBlock, this.currentBlock)(from, to, line.text, line.from)
                    },
                    replace: this.replaceStr,
                });
                this.view.dispatch({
                    effects: setSearchQuery.of(query),
                });
            },

            onUpdate(update) {
                //console.log("SearchPanel onUpdate", this.view, update)
                this.currentBlock = getActiveNoteBlock(this.view.state)
            },

            onClose() {
                closeSearchPanel(this.view);
            },

            onKeyDown(e) {
                runScopeHandlers(this.view, e, "search-panel")
            },

            onQueryKeyDown(e) {
                if (e.keyCode === 13) {
                    // Enter key
                    if (e.shiftKey) {
                        findPrevious(this.view);
                    } else {
                        findNext(this.view);
                    }
                    e.preventDefault();
                }
            },

            onReplaceKeyDown(e) {
                if (e.keyCode === 13) {
                    // Enter key
                    if (e.metaKey || e.ctrlKey) {
                        replaceAll(this.view);
                    } else {
                        replaceNext(this.view);
                    }
                    e.preventDefault();
                }
            },

            onToggleClick(event) {
                // detail > 0 means this was a mouse click (and not toggle by keyboard)
                if (event.detail > 0) {
                    this.$refs.input.focus()
                }
                this.settingsStore.updateSettings({
                    searchSettings: {
                        onlyCurrentBlock: this.onlyCurrentBlock,
                        caseSensitive: this.caseSensitive,
                        regexp: this.regexp,
                        wholeWord: this.wholeWord,
                    },
                })
                this.view.dispatch({
                    annotations: [heynoteEvent.of(SEARCH_SETTINGS_UPDATED)],//, Transaction.addToHistory.of(false)],
                })
                this.search()
            },

            findNext() {
                findNext(this.view)
            },

            findPrevious() {
                findPrevious(this.view)
            },

            replace() {
                replaceNext(this.view)
            },
            
            replaceAll() {
                replaceAll(this.view)
            },
        },
        components: {
            InputToggle,
        },
    }
</script>

<template>
    <div :class="{'search-panel':true, expanded:replaceVisible}" @keydown="onKeyDown">
        <button 
            @click="replaceVisible = !replaceVisible"
            class="expand-button">
        </button>
        <div class="rows">
            <div class="search">
                <div class="input-container">
                    <input
                        type="text"
                        v-model="queryStr"
                        ref="input"
                        @keydown="onQueryKeyDown"
                        placeholder="Find…"
                        class="search-query"
                        main-field
                    />
                    <div class="input-buttons">
                        <InputToggle 
                            v-model="onlyCurrentBlock" 
                            type="block"
                            @click="onToggleClick"
                        />
                        <InputToggle 
                            v-model="caseSensitive" 
                            type="case-sensitive"
                            @click="onToggleClick"
                        />
                        <InputToggle 
                            v-model="wholeWord" 
                            type="whole-words"
                            @click="onToggleClick"
                        />
                        <InputToggle 
                            v-model="regexp" 
                            type="regex"
                            @click="onToggleClick"
                        />
                    </div>
                </div>
                <button
                    @click="findPrevious"
                    class="button find-previous"
                    title="Previous Match (Shift+Enter)"
                ></button>
                <button
                    @click="findNext"
                    class="button find-next"
                    title="Next Match (Enter)"
                ></button>
                <button
                    @click="onClose"
                    class="button close"
                    title="Close Search (Esc)"
                ></button>
            </div>
            <div class="replace" v-show="replaceVisible">
                <input 
                    type="text" 
                    placeholder="Replace…" 
                    v-model="replaceStr"
                    @keydown="onReplaceKeyDown"
                >
                <button
                    @click="replace"
                    class="button replace"
                    title="Replace Match (Enter)"
                ></button>
                <button
                    @click="replaceAll"
                    class="button replace-all"
                    :title="'Replace All Matches (' + ctrlCmdCharacter + '+Enter)'"
                ></button>
            </div>
        </div>
    </div>
</template>

<style lang="sass" scoped>
    input[type="text"]
        background: #fff
        padding: 4px 5px
        border: 1px solid #ccc
        box-sizing: border-box
        border-radius: 2px
        width: 300px
        &:focus
            outline: none
            border: 1px solid #fff
            outline: 2px solid #48b57e
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
    
    .search-panel
        position: absolute
        top: 0
        right: 16px
        //width: 400px
        background-color: var(--panel-background)
        padding: 10px 4px 10px 3px
        border-radius: 0 0 5px 5px
        display: flex
        flex-direction: row
        align-items: stretch
        box-shadow: 0 0 10px rgba(0,0,0,0.3)
        font-size: 13px
        +dark-mode
            box-shadow: 0 0 10px rgba(0,0,0,0.5)
            color: rgba(255,255,255, 0.7)
            //border: 1px solid #272727
        
        .expand-button
            border: none
            background: url('@/assets/icons/caret-right-alpha50.svg') no-repeat center center
            background-size: 16px
            border-radius: 2px
            cursor: pointer
            width: 22px
            margin-right: 3px
            +dark-mode
                background-image: url('@/assets/icons/caret-right-white-alpha50.svg')
            &:focus-visible
                outline: none
                border: 2px solid #48b57e
            &:hover
                background-color: rgba(0,0,0, 0.1)
                +dark-mode
                    background-color: rgba(255,255,255, 0.15)
        &.expanded .expand-button
            background-image: url('@/assets/icons/caret-down-alpha50.svg')
            +dark-mode
                background-image: url('@/assets/icons/caret-down-white-alpha50.svg')
        
        .rows
            display: flex
            flex-direction: column
            flex-grow: 1
        .search
            display: flex
            align-items: center
            flex-grow: 1
            .input-container
                position: relative
                flex-grow: 1
                margin-right: 4px
                input.search-query
                    padding-right: 100px
                .input-buttons
                    position: absolute
                    top: 0
                    right: 1px
                    bottom: 0
                    display: flex
                    align-items: center
        .replace
            display: flex
            padding-top: 4px
            input[type="text"]
                margin-right: 4px
        .button
            border: none
            background: transparent no-repeat center center
            background-size: 16px
            height: 28px
            width: 24px
            border-radius: 2px
            cursor: pointer
            &:focus-visible
                outline: none
                border: 2px solid #48b57e
            &:hover
                background-color: rgba(0,0,0, 0.1)
                +dark-mode
                    background-color: rgba(255,255,255, 0.15)
            &.close
                background-image: url('@/assets/icons/close.svg')
                +dark-mode
                    background-image: url('@/assets/icons/close-dark.svg')
            &.find-next
                background-image: url('@/assets/icons/search-icons/find-next.svg')
                +dark-mode
                    background-image: url('@/assets/icons/search-icons/find-next-dark.svg')
            &.find-previous
                background-image: url('@/assets/icons/search-icons/find-previous.svg')
                +dark-mode
                    background-image: url('@/assets/icons/search-icons/find-previous-dark.svg')
            &.replace
                background-image: url('@/assets/icons/search-icons/replace.svg')
                background-size: 18px
                opacity: 0.8
                +dark-mode
                    background-image: url('@/assets/icons/search-icons/replace-dark.svg')
                    opacity: 1
            &.replace-all
                background-image: url('@/assets/icons/search-icons/replace-all.svg')
                background-size: 18px
                opacity: 0.8
                +dark-mode
                    background-image: url('@/assets/icons/search-icons/replace-all-dark.svg')
                    opacity: 1
</style>

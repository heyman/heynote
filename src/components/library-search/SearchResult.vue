<script>
    import { mapActions, mapStores } from "pinia"

    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSearchStore } from "@/src/stores/search-store"

    const MATCH_PREVIEW_CONTEXT_LENGTH = 20
    // Reuse one segmenter across result rows; constructing it per row is expensive
    // when a search streams thousands of matches.
    const graphemeSegmenter = Intl?.Segmenter
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null

    export default {
        props: ["result", "query", "caseSensitive"],

        data() {
            return {
                open: true,
            }
        },

        computed: {
            ...mapStores(useHeynoteStore, useSearchStore),

            bufferName() {
                const buffer = this.heynoteStore.buffers[this.result.buffer]
                return buffer?.name ? buffer.name : this.result.buffer.split(window.heynote.buffer.pathSeparator).at(-1)
            },

            bufferDir() {
                const parts = this.result.buffer.split(window.heynote.buffer.pathSeparator)
                return parts.at(-2)
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "openBuffer",
            ]),

            toggleOpen() {
                this.open = !this.open
            },

            toggleBuffer(event) {
                this.searchStore.selectBuffer(this.result.buffer)
                this.toggleOpen()
                this.focusResults(event.currentTarget)
            },

            async openMatch(match, focusTarget) {
                this.searchStore.selectMatch({
                    buffer: this.result.buffer,
                    ...match,
                })
                this.openBuffer(this.result.buffer, { focusEditor: false })
                await this.$nextTick()

                const editor = this.heynoteStore.currentEditor
                await editor?.contentLoadedPromise

                if (this.heynoteStore.currentBufferPath !== this.result.buffer) {
                    return
                }

                const firstSubmatch = this.normalizedSubmatches(match)[0]
                if (firstSubmatch) {
                    editor?.setSelectionAtLineColumns(match.lineNumber, firstSubmatch.start, firstSubmatch.end)
                } else {
                    editor?.setCursorPositionAtLineColumn(match.lineNumber)
                }
                if (this.heynoteStore.currentLeftPanel === "search" && focusTarget?.isConnected) {
                    focusTarget.focus({ preventScroll: true })
                }
            },

            focusResults(element) {
                element?.closest(".results")?.focus({ preventScroll: true })
            },

            isSelectedBuffer() {
                const selectedRow = this.searchStore.selectedResultRow
                return selectedRow?.type === "buffer" &&
                    selectedRow.buffer === this.result.buffer
            },

            isSelectedMatch(match) {
                const selectedRow = this.searchStore.selectedResultRow
                return selectedRow?.type === "match" &&
                    selectedRow.buffer === this.result.buffer &&
                    selectedRow.lineNumber === match.lineNumber &&
                    selectedRow.line === match.line
            },

            highlightedParts(match) {
                const line = match.displayLine || match.line
                const submatches = this.normalizedSubmatchList(match.displaySubmatches || match.submatches)
                if (submatches.length === 0) {
                    return [{ text: line, highlight: false }]
                }
                const preview = this.matchPreview(line, submatches[0].start)
                const visibleLine = preview.line
                const parts = []
                let cursor = 0
                for (const submatch of submatches) {
                    const start = Math.max(preview.prefixLength, submatch.start - preview.startIndex + preview.prefixLength)
                    const end = Math.min(visibleLine.length, submatch.end - preview.startIndex + preview.prefixLength)
                    if (end <= start || end <= cursor) {
                        continue
                    }
                    if (start > cursor) {
                        parts.push({ text: visibleLine.slice(cursor, start), highlight: false })
                    }
                    parts.push({ text: visibleLine.slice(start, end), highlight: true })
                    cursor = end
                }
                if (cursor < visibleLine.length) {
                    parts.push({ text: visibleLine.slice(cursor), highlight: false })
                }
                return parts.length ? parts : [{ text: visibleLine, highlight: false }]
            },

            normalizedSubmatches(match) {
                return this.normalizedSubmatchList(match.submatches)
            },

            normalizedSubmatchList(submatches) {
                return (submatches || [])
                    .filter((submatch) => (
                        Number.isInteger(submatch.start) &&
                        Number.isInteger(submatch.end) &&
                        submatch.end > submatch.start
                    ))
                    .sort((a, b) => a.start - b.start)
            },

            matchPreview(line, firstMatchIndex) {
                if (firstMatchIndex <= MATCH_PREVIEW_CONTEXT_LENGTH) {
                    return {
                        line,
                        startIndex: 0,
                        prefixLength: 0,
                    }
                }
                const lineBeforeMatch = line.slice(0, firstMatchIndex)
                const previewStart = this.previewStartIndex(lineBeforeMatch)
                if (previewStart === 0) {
                    return {
                        line,
                        startIndex: 0,
                        prefixLength: 0,
                    }
                }
                return {
                    line: "..." + line.slice(previewStart),
                    startIndex: previewStart,
                    prefixLength: 3,
                }
            },

            previewStartIndex(text) {
                // Keep only the last N grapheme start offsets so long lines do not
                // allocate an array of every segment before the match.
                const recentIndexes = []
                let count = 0
                if (graphemeSegmenter) {
                    for (const { index } of graphemeSegmenter.segment(text)) {
                        count++
                        recentIndexes.push(index)
                        if (recentIndexes.length > MATCH_PREVIEW_CONTEXT_LENGTH) {
                            recentIndexes.shift()
                        }
                    }
                    return count > MATCH_PREVIEW_CONTEXT_LENGTH ? recentIndexes[0] : 0
                }

                let index = 0
                for (const codePoint of text) {
                    count++
                    recentIndexes.push(index)
                    if (recentIndexes.length > MATCH_PREVIEW_CONTEXT_LENGTH) {
                        recentIndexes.shift()
                    }
                    index += codePoint.length
                }
                return count > MATCH_PREVIEW_CONTEXT_LENGTH ? recentIndexes[0] : 0
            },

            indentGuides(level) {
                return Array.from({ length: Math.max(0, level) }, (_, index) => index)
            },
        },
    }
</script>

<template>
    <div class="result-container">
        <div
            :class="{ buffer: true, open, 'search-result-row': true, selected: isSelectedBuffer() }"
            :title="result.buffer"
            data-row-type="buffer"
            :data-buffer="result.buffer"
            @click="toggleBuffer"
        >
            <span class="name">{{ bufferName }}</span>
            <span v-if="bufferDir" class="dir">{{ bufferDir }}</span>
        </div>
        <div v-if="open" class="matches">
            <div
                :class="{ match: true, 'search-result-row': true, selected: isSelectedMatch(match) }"
                v-for="match in result.matches"
                :key="match.lineNumber + ':' + match.line"
                data-row-type="match"
                :data-buffer="result.buffer"
                :data-line-number="match.lineNumber"
                :data-line="match.line"
                @click="openMatch(match, $event.currentTarget.closest('.results'))"
            >
                <span
                    v-for="guideLevel in indentGuides(1)"
                    :key="guideLevel"
                    class="indent-guide"
                    :style="{ '--guide-level': guideLevel }"
                ></span>
                <span class="line-text">
                    <template
                        v-for="(part, index) in highlightedParts(match)"
                        :key="index"
                    >
                        <strong v-if="part.highlight">{{ part.text }}</strong>
                        <template v-else>{{ part.text }}</template>
                    </template>
                </span>
            </div>
        </div>
    </div>
</template>

<style lang="sass" scoped>
    .result-container
        color: rgba(0,0,0, 0.7)
        +dark-mode
            color: rgba(255,255,255, 0.7)
        .buffer
            cursor: pointer
            line-height: 20px
            padding: 2px 10px 2px 24px
            position: relative
            white-space: nowrap
            overflow: hidden
            text-overflow: ellipsis
            background-image: url('@/assets/icons/caret-right.svg')
            background-size: 12px
            background-repeat: no-repeat
            background-position: 9px 6px
            +dark-mode
                background-image: url('@/assets/icons/caret-right-white.svg')
            &.open
                background-image: url('@/assets/icons/caret-down.svg')
                +dark-mode
                    background-image: url('@/assets/icons/caret-down-white.svg')
            &:hover
                background-color: rgba(0,0,0, 0.06)
                +dark-mode
                    background-color: rgba(255,255,255, 0.08)
            &:focus
                outline: none
            &:focus-visible
                outline: 1px solid var(--ui-accent)
                outline-offset: -1px
                z-index: 1
            .name
                vertical-align: middle
            .dir
                margin-left: 10px
                font-size: 0.9em
                vertical-align: middle
                opacity: 0.65
        .matches 
            .match
                cursor: pointer
                display: flex
                gap: 8px
                line-height: 20px
                padding: 2px 10px 2px 34px
                white-space: nowrap
                overflow: hidden
                position: relative
                &:hover
                    background-color: rgba(0,0,0, 0.06)
                    +dark-mode
                        background-color: rgba(255,255,255, 0.08)
                &:focus
                    outline: none
                &:focus-visible
                    outline: 1px solid var(--ui-accent)
                    outline-offset: -1px
                    z-index: 1
                .indent-guide
                    position: absolute
                    top: 0
                    bottom: 0
                    left: calc(14px + var(--guide-level) * 20px)
                    width: 1px
                    opacity: var(--search-indent-guide-opacity, 0)
                    pointer-events: none
                    background: rgba(0,0,0, 0.14)
                    transition: opacity 80ms ease
                    +dark-mode
                        background: rgba(255,255,255, 0.18)
                .line-number
                    flex: 0 0 32px
                    text-align: right
                    opacity: 0.55
                    font-variant-numeric: tabular-nums
                .line-text
                    min-width: 0
                    overflow: hidden
                    text-overflow: ellipsis
                    strong
                        font-weight: 700
                        color: rgba(0,0,0, 0.88)
                        +dark-mode
                            color: rgba(255,255,255, 0.95)
</style>

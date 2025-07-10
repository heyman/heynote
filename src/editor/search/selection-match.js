
import { EditorView, ViewPlugin, Decoration } from "@codemirror/view"
import { EditorSelection, Facet, combineConfig, CharCategory } from "@codemirror/state"

import { SearchCursor } from "../codemirror-search/search.ts"

import { useSettingsStore } from "@/src/stores/settings-store.js"
import { getActiveNoteBlock } from "../block/block.js"
import { delimiterRegexWithoutNewline } from "../block/block.js"
import { transactionsHasAnnotation, SEARCH_SETTINGS_UPDATED } from "../annotation.js"



const defaultHighlightOptions = {
    highlightWordAroundCursor: false,
    minSelectionLength: 1,
    maxMatches: 100,
    wholeWords: false
}

const highlightConfig = Facet.define({
    combine(options) {
        return combineConfig(options, defaultHighlightOptions, {
            highlightWordAroundCursor: (a, b) => a || b,
            minSelectionLength: Math.min,
            maxMatches: Math.min
        })
    }
})

/// This extension highlights text that matches the selection. It uses
/// the `"cm-selectionMatch"` class for the highlighting. When
/// `highlightWordAroundCursor` is enabled, the word at the cursor
/// itself will be highlighted with `"cm-selectionMatch-main"`.
export function highlightSelectionMatches(options) {
    let ext = [defaultTheme, matchHighlighter]
    if (options) ext.push(highlightConfig.of(options))
    return ext
}

const matchDeco = Decoration.mark({ class: "cm-selectionMatch" })
const mainMatchDeco = Decoration.mark({ class: "cm-selectionMatch cm-selectionMatch-main" })

// Whether the characters directly outside the given positions are non-word characters
function insideWordBoundaries(check, state, from, to) {
    return (from == 0 || check(state.sliceDoc(from - 1, from)) != CharCategory.Word) &&
        (to == state.doc.length || check(state.sliceDoc(to, to + 1)) != CharCategory.Word)
}

// Whether the characters directly at the given positions are word characters
function insideWord(check, state, from, to) {
    return check(state.sliceDoc(from, from + 1)) == CharCategory.Word
        && check(state.sliceDoc(to - 1, to)) == CharCategory.Word
}

const matchHighlighter = ViewPlugin.fromClass(class {
    decorations

    constructor(view) {
        this.decorations = this.getDeco(view)
    }

    update(update) {
        if (update.selectionSet || update.docChanged || update.viewportChanged || transactionsHasAnnotation(update.transactions, SEARCH_SETTINGS_UPDATED)) {
            this.decorations = this.getDeco(update.view)
        }
    }

    getDeco(view) {
        let conf = view.state.facet(highlightConfig)
        let { state } = view, sel = state.selection
        //if (sel.ranges.length > 1) return Decoration.none

        let range = sel.main, query, check = null
        if (range.empty) {
            if (!conf.highlightWordAroundCursor) return Decoration.none
            let word = state.wordAt(range.head)
            if (!word) return Decoration.none
            check = state.charCategorizer(range.head)
            query = state.sliceDoc(word.from, word.to)
        } else {
            let len = range.to - range.from
            if (len < conf.minSelectionLength || len > 200) return Decoration.none
            if (conf.wholeWords) {
                query = state.sliceDoc(range.from, range.to) // TODO: allow and include leading/trailing space?
                check = state.charCategorizer(range.head)
                if (!(insideWordBoundaries(check, state, range.from, range.to) &&
                    insideWord(check, state, range.from, range.to))) return Decoration.none
            } else {
                query = state.sliceDoc(range.from, range.to)
                if (!query) return Decoration.none
            }
        }

        const settingsStore = useSettingsStore()
        let fullWord = false
        if (settingsStore.settings.searchSettings?.wholeWord) {
            let word = state.wordAt(range.from)
            fullWord = word && word.from == range.from && word.to == range.to;
        }
        const isSelection = (from, to) => {
            return sel.ranges.some(range => range.from == from && range.to == to)
        }

        let deco = []
        for (let part of view.visibleRanges) {
            let cursor = new SearchCursor(state.doc, query, part.from, part.to, normalizeFunc(), currentBlockTestFilter(view.state))
            while (!cursor.next().done) {
                let { from, to } = cursor.value
                // Skip selected matches to prevent styling conflicts
                if (isSelection(from, to)) continue
                if (fullWord) {
                    let word = state.wordAt(from);
                    if (!word || word.from != from || word.to != to)
                        continue;
                }
                if (!check || insideWordBoundaries(check, state, from, to)) {
                    if (range.empty && from <= range.from && to >= range.to)
                        deco.push(mainMatchDeco.range(from, to))
                    else if (from >= range.to || to <= range.from)
                        deco.push(matchDeco.range(from, to))
                    if (deco.length > conf.maxMatches) return Decoration.none
                }
            }
        }
        return Decoration.set(deco)
    }
}, {
    decorations: v => v.decorations
})

const defaultTheme = EditorView.baseTheme({
    ".cm-selectionMatch": { backgroundColor: "#99ff7780" },
    ".cm-searchMatch .cm-selectionMatch": { backgroundColor: "transparent" }
})




// Select the words around the cursors.
const selectWord = ({ state, dispatch }) => {
    let { selection } = state;
    let newSel = EditorSelection.create(selection.ranges.map(range => state.wordAt(range.head) || EditorSelection.cursor(range.head)), selection.mainIndex);
    if (newSel.eq(selection))
        return false;
    dispatch(state.update({ selection: newSel }));
    return true;
};


function currentBlockTestFilter(state) {
    const settingsStore = useSettingsStore()
    const currentBlock = getActiveNoteBlock(state)
    const onlyCurrentBlock = settingsStore.settings.searchSettings === undefined ? true : settingsStore.settings.searchSettings.onlyCurrentBlock
    return (from, to, buffer, bufferPos) => {
        return !delimiterRegexWithoutNewline.test(buffer) && (
            onlyCurrentBlock ? from >= currentBlock.content.from && to <= currentBlock.content.to : true
        )
    }
}


function normalizeFunc() {
    const settingsStore = useSettingsStore()
    if (settingsStore.settings.searchSettings?.caseSensitive) {
        return (x) => x
    } else {
        return (x) => x.toLowerCase()
    }
}

// Find next occurrence of query relative to last cursor. Wrap around 
// the document if there are no more matches.
function findNextOccurrence(state, query) {
    //console.log("findNextOccurrence")
    const settingsStore = useSettingsStore()
    let { main, ranges } = state.selection;
    
    let fullWord = false
    if (settingsStore.settings.searchSettings?.wholeWord) {
        let word = state.wordAt(main.head)
        fullWord = word && word.from == main.from && word.to == main.to;
    }
    const caseSensitiveNormalize = normalizeFunc()

    for (let cycled = false, cursor = new SearchCursor(
        state.doc, 
        query, 
        ranges[ranges.length - 1].to,
        undefined, 
        caseSensitiveNormalize, 
        currentBlockTestFilter(state),
    );;) {
        cursor.next();
        if (cursor.done) {
            if (cycled) {
                return null
            }
            cursor = new SearchCursor(
                state.doc, 
                query, 
                0, 
                Math.max(0, ranges[ranges.length - 1].from - 1), 
                caseSensitiveNormalize, 
                currentBlockTestFilter(state),
            )
            cycled = true;
        }
        else {
            if (cycled && ranges.some(r => r.from == cursor.value.from))
                continue;
            if (fullWord) {
                let word = state.wordAt(cursor.value.from);
                if (!word || word.from != cursor.value.from || word.to != cursor.value.to)
                    continue;
            }
            return cursor.value;
        }
    }
}

/**
Select next occurrence of the current selection. Expand selection
to the surrounding word when the selection is empty.
*/
export const selectNextOccurrence = ({ state, dispatch }) => {
    const normalize = normalizeFunc()
    let { ranges } = state.selection;
    if (ranges.some(sel => sel.from === sel.to))
        return selectWord({ state, dispatch });
    let searchedText = normalize(state.sliceDoc(ranges[0].from, ranges[0].to));
    if (state.selection.ranges.some(r => normalize(state.sliceDoc(r.from, r.to)) != searchedText)) {
        return false;
    }
    let range = findNextOccurrence(state, searchedText);
    if (!range)
        return false;
    dispatch(state.update({
        selection: state.selection.addRange(EditorSelection.range(range.from, range.to), false),
        effects: EditorView.scrollIntoView(range.to)
    }));
    return true;
};


/// Select all instances of the currently selected text.
export const selectSelectionMatches = ({state, dispatch}) => {
    let sel = state.selection
    if (sel.ranges.length > 1 || sel.main.empty) return false
    let {from, to} = sel.main
    let ranges = [], main = 0
    for (let cur = new SearchCursor(state.doc, state.sliceDoc(from, to), undefined, undefined, undefined, currentBlockTestFilter(state)); !cur.next().done;) {
      if (ranges.length > 1000) return false
      if (cur.value.from == from) main = ranges.length
      ranges.push(EditorSelection.range(cur.value.from, cur.value.to))
    }
    dispatch(state.update({
      selection: EditorSelection.create(ranges, main),
      userEvent: "select.search.matches"
    }))
    return true
  }

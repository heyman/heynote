import {EditorView, ViewPlugin, Decoration, DecorationSet, ViewUpdate} from "@codemirror/view"
import {Facet, combineConfig, Extension, CharCategory, EditorSelection,
        EditorState, StateCommand} from "@codemirror/state"
import {SearchCursor} from "./cursor"

type HighlightOptions = {
  /// Determines whether, when nothing is selected, the word around
  /// the cursor is matched instead. Defaults to false.
  highlightWordAroundCursor?: boolean,
  /// The minimum length of the selection before it is highlighted.
  /// Defaults to 1 (always highlight non-cursor selections).
  minSelectionLength?: number,
  /// The amount of matches (in the viewport) at which to disable
  /// highlighting. Defaults to 100.
  maxMatches?: number
  /// Whether to only highlight whole words.
  wholeWords?: boolean
}

const defaultHighlightOptions = {
  highlightWordAroundCursor: false,
  minSelectionLength: 1,
  maxMatches: 100,
  wholeWords: false
}

const highlightConfig = Facet.define<HighlightOptions, Required<HighlightOptions>>({
  combine(options: readonly HighlightOptions[]) {
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
export function highlightSelectionMatches(options?: HighlightOptions): Extension {
  let ext = [defaultTheme, matchHighlighter]
  if (options) ext.push(highlightConfig.of(options))
  return ext
}

const matchDeco = Decoration.mark({class: "cm-selectionMatch"})
const mainMatchDeco = Decoration.mark({class: "cm-selectionMatch cm-selectionMatch-main"})

// Whether the characters directly outside the given positions are non-word characters
function insideWordBoundaries (check: (char: string) => CharCategory, state: EditorState, from: number, to: number): boolean {
  return (from == 0 || check(state.sliceDoc(from - 1, from)) != CharCategory.Word) &&
      (to == state.doc.length || check(state.sliceDoc(to, to + 1)) != CharCategory.Word)
}

// Whether the characters directly at the given positions are word characters
function insideWord (check: (char: string) => CharCategory, state: EditorState, from: number, to: number): boolean {
  return check(state.sliceDoc(from, from + 1)) == CharCategory.Word
      && check(state.sliceDoc(to - 1, to)) == CharCategory.Word
}

const matchHighlighter = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.getDeco(view)
  }

  update(update: ViewUpdate) {
    if (update.selectionSet || update.docChanged || update.viewportChanged) this.decorations = this.getDeco(update.view)
  }

  getDeco(view: EditorView) {
    let conf = view.state.facet(highlightConfig)
    let {state} = view, sel = state.selection
    if (sel.ranges.length > 1) return Decoration.none
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
    let deco = []
    for (let part of view.visibleRanges) {
      let cursor = new SearchCursor(state.doc, query, part.from, part.to)
      while (!cursor.next().done) {
        let {from, to} = cursor.value
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
  ".cm-searchMatch .cm-selectionMatch": {backgroundColor: "transparent"}
})

// Select the words around the cursors.
const selectWord: StateCommand = ({state, dispatch}) => {
  let {selection} = state
  let newSel = EditorSelection.create(selection.ranges.map(
    range => state.wordAt(range.head) || EditorSelection.cursor(range.head)
  ), selection.mainIndex)
  if (newSel.eq(selection)) return false
  dispatch(state.update({selection: newSel}))
  return true
}

// Find next occurrence of query relative to last cursor. Wrap around
// the document if there are no more matches.
function findNextOccurrence(state: EditorState, query: string) {
  let {main, ranges} = state.selection
  let word = state.wordAt(main.head), fullWord = word && word.from == main.from && word.to == main.to
  for (let cycled = false, cursor = new SearchCursor(state.doc, query, ranges[ranges.length - 1].to);;) {
    cursor.next()
    if (cursor.done) {
      if (cycled) return null
      cursor = new SearchCursor(state.doc, query, 0, Math.max(0, ranges[ranges.length - 1].from - 1))
      cycled = true
    } else {
      if (cycled && ranges.some(r => r.from == cursor.value.from))
        continue
      if (fullWord) {
        let word = state.wordAt(cursor.value.from)
        if (!word || word.from != cursor.value.from || word.to != cursor.value.to) continue
      }
      return cursor.value
    }
  }
}

/// Select next occurrence of the current selection. Expand selection
/// to the surrounding word when the selection is empty.
export const selectNextOccurrence: StateCommand = ({state, dispatch}) => {
  let {ranges} = state.selection
  if (ranges.some(sel => sel.from === sel.to)) return selectWord({state, dispatch})

  let searchedText = state.sliceDoc(ranges[0].from, ranges[0].to)
  if (state.selection.ranges.some(r => state.sliceDoc(r.from, r.to) != searchedText))
    return false

  let range = findNextOccurrence(state, searchedText)
  if (!range) return false

  dispatch(state.update({
    selection: state.selection.addRange(EditorSelection.range(range.from, range.to), false),
    effects: EditorView.scrollIntoView(range.to)
  }))
  return true
}

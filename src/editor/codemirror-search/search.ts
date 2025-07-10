import {EditorView, ViewPlugin, ViewUpdate, Command, Decoration, DecorationSet,
        runScopeHandlers, KeyBinding,
        PanelConstructor, showPanel, Panel, getPanel} from "@codemirror/view"
import {EditorState, StateField, StateEffect, EditorSelection, SelectionRange, StateCommand, Prec,
        Facet, Extension, RangeSetBuilder, Text, CharCategory, findClusterBreak,
        combineConfig} from "@codemirror/state"
import elt from "crelt"
import {SearchCursor} from "./cursor"
import {RegExpCursor, validRegExp} from "./regexp"
import {gotoLine} from "./goto-line"
import {selectNextOccurrence} from "./selection-match"

export {highlightSelectionMatches} from "./selection-match"
export {SearchCursor, RegExpCursor, gotoLine, selectNextOccurrence}

interface SearchConfig {
  /// Whether to position the search panel at the top of the editor
  /// (the default is at the bottom).
  top?: boolean

  /// Whether to enable case sensitivity by default when the search
  /// panel is activated (defaults to false).
  caseSensitive?: boolean

  /// Whether to treat string searches literally by default (defaults to false).
  literal?: boolean

  /// Controls whether the default query has by-word matching enabled.
  /// Defaults to false.
  wholeWord?: boolean

  /// Used to turn on regular expression search in the default query.
  /// Defaults to false.
  regexp?: boolean

  /// Can be used to override the way the search panel is implemented.
  /// Should create a [Panel](#view.Panel) that contains a form
  /// which lets the user:
  ///
  /// - See the [current](#search.getSearchQuery) search query.
  /// - Manipulate the [query](#search.SearchQuery) and
  ///   [update](#search.setSearchQuery) the search state with a new
  ///   query.
  /// - Notice external changes to the query by reacting to the
  ///   appropriate [state effect](#search.setSearchQuery).
  /// - Run some of the search commands.
  ///
  /// The field that should be focused when opening the panel must be
  /// tagged with a `main-field=true` DOM attribute.
  createPanel?: (view: EditorView) => Panel,

  /// By default, matches are scrolled into view using the default
  /// behavior of
  /// [`EditorView.scrollIntoView`](#view.EditorView^scrollIntoView).
  /// This option allows you to pass a custom function to produce the
  /// scroll effect.
  scrollToMatch?: (range: SelectionRange, view: EditorView) => StateEffect<unknown>
}

const searchConfigFacet: Facet<SearchConfig, Required<SearchConfig>> = Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      top: false,
      caseSensitive: false,
      literal: false,
      regexp: false,
      wholeWord: false,
      createPanel: view => new SearchPanel(view),
      scrollToMatch: range => EditorView.scrollIntoView(range)
    })
  }
})

/// Add search state to the editor configuration, and optionally
/// configure the search extension.
/// ([`openSearchPanel`](#search.openSearchPanel) will automatically
/// enable this if it isn't already on).
export function search(config?: SearchConfig): Extension {
  return config ? [searchConfigFacet.of(config), searchExtensions] : searchExtensions
}

/// A search query. Part of the editor's search state.
export class SearchQuery {
  /// The search string (or regular expression).
  readonly search: string
  /// Indicates whether the search is case-sensitive.
  readonly caseSensitive: boolean
  /// By default, string search will replace `\n`, `\r`, and `\t` in
  /// the query with newline, return, and tab characters. When this
  /// is set to true, that behavior is disabled.
  readonly literal: boolean
  /// When true, the search string is interpreted as a regular
  /// expression.
  readonly regexp: boolean
  /// The replace text, or the empty string if no replace text has
  /// been given.
  readonly replace: string
  /// Whether this query is non-empty and, in case of a regular
  /// expression search, syntactically valid.
  readonly valid: boolean
  /// When true, matches that contain words are ignored when there are
  /// further word characters around them.
  readonly wholeWord: boolean

  /// @internal
  readonly unquoted: string

  readonly test: ((from: number, to: number, buffer: string, bufferPos: number) => boolean) | undefined
  readonly regexpTest: ((from: number, to: number, match: RegExpExecArray) => boolean) | undefined

  /// Create a query object.
  constructor(config: {
    /// The search string.
    search: string,
    /// Controls whether the search should be case-sensitive.
    caseSensitive?: boolean,
    /// By default, string search will replace `\n`, `\r`, and `\t` in
    /// the query with newline, return, and tab characters. When this
    /// is set to true, that behavior is disabled.
    literal?: boolean,
    /// When true, interpret the search string as a regular expression.
    regexp?: boolean,
    /// The replace text.
    replace?: string,
    /// Enable whole-word matching.
    wholeWord?: boolean

    test?: (from: number, to: number, buffer: string, bufferPos: number) => boolean
    regexpTest?: (from: number, to: number, match: RegExpExecArray) => boolean
  }) {
    this.search = config.search
    this.caseSensitive = !!config.caseSensitive
    this.literal = !!config.literal
    this.regexp = !!config.regexp
    this.replace = config.replace || ""
    this.valid = !!this.search && (!this.regexp || validRegExp(this.search))
    this.unquoted = this.unquote(this.search)
    this.wholeWord = !!config.wholeWord
    this.test = config.test
    this.regexpTest = config.regexpTest
  }

  /// @internal
  unquote(text: string) {
    return this.literal ? text :
      text.replace(/\\([nrt\\])/g, (_, ch) => ch == "n" ? "\n" : ch == "r" ? "\r" : ch == "t" ? "\t" : "\\")
  }

  /// Compare this query to another query.
  eq(other: SearchQuery) {
    return this.search == other.search && this.replace == other.replace &&
      this.caseSensitive == other.caseSensitive && this.regexp == other.regexp &&
      this.wholeWord == other.wholeWord
  }

  /// @internal
  create(): QueryType {
    return this.regexp ? new RegExpQuery(this) : new StringQuery(this)
  }

  /// Get a search cursor for this query, searching through the given
  /// range in the given state.
  getCursor(state: EditorState | Text, from: number = 0, to?: number): Iterator<{from: number, to: number}> {
    let st = (state as any).doc ? state as EditorState : EditorState.create({doc: state as Text})
    if (to == null) to = st.doc.length
    return this.regexp ? regexpCursor(this, st, from, to) : stringCursor(this, st, from, to)
  }
}

type SearchResult = typeof SearchCursor.prototype.value

abstract class QueryType<Result extends SearchResult = SearchResult> {
  constructor(readonly spec: SearchQuery) {}

  abstract nextMatch(state: EditorState, curFrom: number, curTo: number): Result | null

  abstract prevMatch(state: EditorState, curFrom: number, curTo: number): Result | null

  abstract getReplacement(result: Result): string

  abstract matchAll(state: EditorState, limit: number): readonly Result[] | null

  abstract highlight(state: EditorState, from: number, to: number, add: (from: number, to: number) => void): void
}

const enum FindPrev { ChunkSize = 10000 }

function stringCursor(spec: SearchQuery, state: EditorState, from: number, to: number) {
  const test = (from: number, to: number, buffer: string, bufferPos: number) => {
    return (
      (spec.wholeWord ? stringWordTest(state.doc, state.charCategorizer(state.selection.main.head))(from, to, buffer, bufferPos) : true) &&
      (spec.test ? spec.test(from, to, buffer, bufferPos) : true)
    )
  }
  return new SearchCursor(
    state.doc, spec.unquoted, from, to, spec.caseSensitive ? undefined : x => x.toLowerCase(), 
    spec.wholeWord || spec.test ? test : undefined)
}

function stringWordTest(doc: Text, categorizer: (ch: string) => CharCategory) {
  return (from: number, to: number, buf: string, bufPos: number) => {
    if (bufPos > from || bufPos + buf.length < to) {
      bufPos = Math.max(0, from - 2)
      buf = doc.sliceString(bufPos, Math.min(doc.length, to + 2))
    }
    return (categorizer(charBefore(buf, from - bufPos)) != CharCategory.Word ||
            categorizer(charAfter(buf, from - bufPos)) != CharCategory.Word) &&
           (categorizer(charAfter(buf, to - bufPos)) != CharCategory.Word ||
            categorizer(charBefore(buf, to - bufPos)) != CharCategory.Word)
  }
}

class StringQuery extends QueryType<SearchResult> {
  constructor(spec: SearchQuery) {
    super(spec)
  }

  nextMatch(state: EditorState, curFrom: number, curTo: number) {
    let cursor = stringCursor(this.spec, state, curTo, state.doc.length).nextOverlapping()
    if (cursor.done) {
      let end = Math.min(state.doc.length, curFrom + this.spec.unquoted.length)
      cursor = stringCursor(this.spec, state, 0, end).nextOverlapping()
    }
    return cursor.done || cursor.value.from == curFrom && cursor.value.to == curTo ? null : cursor.value
  }

  // Searching in reverse is, rather than implementing an inverted search
  // cursor, done by scanning chunk after chunk forward.
  private prevMatchInRange(state: EditorState, from: number, to: number) {
    for (let pos = to;;) {
      let start = Math.max(from, pos - FindPrev.ChunkSize - this.spec.unquoted.length)
      let cursor = stringCursor(this.spec, state, start, pos), range: SearchResult | null = null
      while (!cursor.nextOverlapping().done) range = cursor.value
      if (range) return range
      if (start == from) return null
      pos -= FindPrev.ChunkSize
    }
  }

  prevMatch(state: EditorState, curFrom: number, curTo: number) {
    let found = this.prevMatchInRange(state, 0, curFrom)
    if (!found)
      found = this.prevMatchInRange(state, Math.max(0, curTo - this.spec.unquoted.length), state.doc.length)
    return found && (found.from != curFrom || found.to != curTo) ? found : null
  }

  getReplacement(_result: SearchResult) { return this.spec.unquote(this.spec.replace) }

  matchAll(state: EditorState, limit: number) {
    let cursor = stringCursor(this.spec, state, 0, state.doc.length), ranges = []
    while (!cursor.next().done) {
      if (ranges.length >= limit) return null
      ranges.push(cursor.value)
    }
    return ranges
  }

  highlight(state: EditorState, from: number, to: number, add: (from: number, to: number) => void) {
    let cursor = stringCursor(this.spec, state, Math.max(0, from - this.spec.unquoted.length),
                              Math.min(to + this.spec.unquoted.length, state.doc.length))
    while (!cursor.next().done) add(cursor.value.from, cursor.value.to)
  }
}

const enum RegExp { HighlightMargin = 250 }

type RegExpResult = typeof RegExpCursor.prototype.value

function regexpCursor(spec: SearchQuery, state: EditorState, from: number, to: number) {
  const test = (from: number, to: number, match: RegExpExecArray) => {
    return (
      (spec.wholeWord ? regexpWordTest(state.charCategorizer(state.selection.main.head))(from, to, match) : true) &&
      (spec.regexpTest ? spec.regexpTest(from, to, match) : true)
    )
  }

  return new RegExpCursor(state.doc, spec.search, {
    ignoreCase: !spec.caseSensitive,
    test: spec.wholeWord || spec.regexpTest ? test : undefined
  }, from, to)
}

function charBefore(str: string, index: number) {
  return str.slice(findClusterBreak(str, index, false), index)
}
function charAfter(str: string, index: number) {
  return str.slice(index, findClusterBreak(str, index))
}

function regexpWordTest(categorizer: (ch: string) => CharCategory) {
  return (_from: number, _to: number, match: RegExpExecArray) =>
    !match[0].length ||
    (categorizer(charBefore(match.input, match.index)) != CharCategory.Word ||
     categorizer(charAfter(match.input, match.index)) != CharCategory.Word) &&
    (categorizer(charAfter(match.input, match.index + match[0].length)) != CharCategory.Word ||
     categorizer(charBefore(match.input, match.index + match[0].length)) != CharCategory.Word)
}

class RegExpQuery extends QueryType<RegExpResult> {
  nextMatch(state: EditorState, curFrom: number, curTo: number) {
    let cursor = regexpCursor(this.spec, state, curTo, state.doc.length).next()
    if (cursor.done) cursor = regexpCursor(this.spec, state, 0, curFrom).next()
    return cursor.done ? null : cursor.value
  }

  private prevMatchInRange(state: EditorState, from: number, to: number) {
    for (let size = 1;; size++) {
      let start = Math.max(from, to - size * FindPrev.ChunkSize)
      let cursor = regexpCursor(this.spec, state, start, to), range: RegExpResult | null = null
      while (!cursor.next().done) range = cursor.value
      if (range && (start == from || range.from > start + 10)) return range
      if (start == from) return null
    }
  }

  prevMatch(state: EditorState, curFrom: number, curTo: number) {
    return this.prevMatchInRange(state, 0, curFrom) ||
      this.prevMatchInRange(state, curTo, state.doc.length)
  }

  getReplacement(result: RegExpResult) {
    return this.spec.unquote(this.spec.replace).replace(/\$([$&]|\d+)/g, (m, i) => {
      if (i == "&") return result.match[0]
      if (i == "$") return "$"
      for (let l = i.length; l > 0; l--) {
        let n = +i.slice(0, l)
        if (n > 0 && n < result.match.length) return result.match[n] + i.slice(l)
      }
      return m
    })
  }

  matchAll(state: EditorState, limit: number) {
    let cursor = regexpCursor(this.spec, state, 0, state.doc.length), ranges = []
    while (!cursor.next().done) {
      if (ranges.length >= limit) return null
      ranges.push(cursor.value)
    }
    return ranges
  }

  highlight(state: EditorState, from: number, to: number, add: (from: number, to: number) => void) {
    let cursor = regexpCursor(this.spec, state, Math.max(0, from - RegExp.HighlightMargin),
                              Math.min(to + RegExp.HighlightMargin, state.doc.length))
    while (!cursor.next().done) add(cursor.value.from, cursor.value.to)
  }
}

/// A state effect that updates the current search query. Note that
/// this only has an effect if the search state has been initialized
/// (by including [`search`](#search.search) in your configuration or
/// by running [`openSearchPanel`](#search.openSearchPanel) at least
/// once).
export const setSearchQuery = StateEffect.define<SearchQuery>()

const togglePanel = StateEffect.define<boolean>()

const searchState: StateField<SearchState> = StateField.define<SearchState>({
  create(state) {
    return new SearchState(defaultQuery(state).create(), null)
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setSearchQuery)) value = new SearchState(effect.value.create(), value.panel)
      else if (effect.is(togglePanel)) value = new SearchState(value.query, effect.value ? createSearchPanel : null)
    }
    return value
  },
  provide: f => showPanel.from(f, val => val.panel)
})

/// Get the current search query from an editor state.
export function getSearchQuery(state: EditorState) {
  let curState = state.field(searchState, false)
  return curState ? curState.query.spec : defaultQuery(state)
}

/// Query whether the search panel is open in the given editor state.
export function searchPanelOpen(state: EditorState) {
  return state.field(searchState, false)?.panel != null
}

class SearchState {
  constructor(readonly query: QueryType, readonly panel: PanelConstructor | null) {}
}

const matchMark = Decoration.mark({class: "cm-searchMatch"}),
      selectedMatchMark = Decoration.mark({class: "cm-searchMatch cm-searchMatch-selected"})

const searchHighlighter = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(readonly view: EditorView) {
    this.decorations = this.highlight(view.state.field(searchState))
  }

  update(update: ViewUpdate) {
    let state = update.state.field(searchState)
    if (state != update.startState.field(searchState) || update.docChanged || update.selectionSet || update.viewportChanged)
      this.decorations = this.highlight(state)
  }

  highlight({query, panel}: SearchState) {
    if (!panel || !query.spec.valid) return Decoration.none
    let {view} = this
    let builder = new RangeSetBuilder<Decoration>()
    for (let i = 0, ranges = view.visibleRanges, l = ranges.length; i < l; i++) {
      let {from, to} = ranges[i]
      while (i < l - 1 && to > ranges[i + 1].from - 2 * RegExp.HighlightMargin) to = ranges[++i].to
      query.highlight(view.state, from, to, (from, to) => {
        let selected = view.state.selection.ranges.some(r => r.from == from && r.to == to)
        builder.add(from, to, selected ? selectedMatchMark : matchMark)
      })
    }
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

function searchCommand(f: (view: EditorView, state: SearchState) => boolean): Command {
  return view => {
    let state = view.state.field(searchState, false)
    return state && state.query.spec.valid ? f(view, state) : openSearchPanel(view)
  }
}

/// Open the search panel if it isn't already open, and move the
/// selection to the first match after the current main selection.
/// Will wrap around to the start of the document when it reaches the
/// end.
export const findNext = searchCommand((view, {query}) => {
  let {to} = view.state.selection.main
  let next = query.nextMatch(view.state, to, to)
  if (!next) return false
  let selection = EditorSelection.single(next.from, next.to)
  let config = view.state.facet(searchConfigFacet)
  view.dispatch({
    selection,
    effects: [announceMatch(view, next), config.scrollToMatch(selection.main, view)],
    userEvent: "select.search"
  })
  selectSearchInput(view)
  return true
})

/// Move the selection to the previous instance of the search query,
/// before the current main selection. Will wrap past the start
/// of the document to start searching at the end again.
export const findPrevious = searchCommand((view, {query}) => {
  let {state} = view, {from} = state.selection.main
  let prev = query.prevMatch(state, from, from)
  if (!prev) return false
  let selection = EditorSelection.single(prev.from, prev.to)
  let config = view.state.facet(searchConfigFacet)
  view.dispatch({
    selection,
    effects: [announceMatch(view, prev), config.scrollToMatch(selection.main, view)],
    userEvent: "select.search"
  })
  selectSearchInput(view)
  return true
})

/// Select all instances of the search query.
export const selectMatches = searchCommand((view, {query}) => {
  let ranges = query.matchAll(view.state, 1000)
  if (!ranges || !ranges.length) return false
  view.dispatch({
    selection: EditorSelection.create(ranges.map(r => EditorSelection.range(r.from, r.to))),
    userEvent: "select.search.matches"
  })
  return true
})

/// Select all instances of the currently selected text.
export const selectSelectionMatches: StateCommand = ({state, dispatch}) => {
  let sel = state.selection
  if (sel.ranges.length > 1 || sel.main.empty) return false
  let {from, to} = sel.main
  let ranges = [], main = 0
  for (let cur = new SearchCursor(state.doc, state.sliceDoc(from, to)); !cur.next().done;) {
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

/// Replace the current match of the search query.
export const replaceNext = searchCommand((view, {query}) => {
  let {state} = view, {from, to} = state.selection.main
  if (state.readOnly) return false
  let match = query.nextMatch(state, from, from)
  if (!match) return false
  let next: SearchResult | null = match
  let changes = [], selection: EditorSelection | undefined, replacement: Text | undefined
  let effects: StateEffect<unknown>[] = []
  if (next.from == from && next.to == to) {
    replacement = state.toText(query.getReplacement(next))
    changes.push({from: next.from, to: next.to, insert: replacement})
    next = query.nextMatch(state, next.from, next.to)
    effects.push(EditorView.announce.of(
      state.phrase("replaced match on line $", state.doc.lineAt(from).number) + "."))
  }
  let changeSet = view.state.changes(changes)
  if (next) {
    selection = EditorSelection.single(next.from, next.to).map(changeSet)
    effects.push(announceMatch(view, next))
    effects.push(state.facet(searchConfigFacet).scrollToMatch(selection.main, view))
  }
  view.dispatch({
    changes: changeSet,
    selection,
    effects,
    userEvent: "input.replace"
  })
  return true
})

/// Replace all instances of the search query with the given
/// replacement.
export const replaceAll = searchCommand((view, {query}) => {
  if (view.state.readOnly) return false
  let changes = query.matchAll(view.state, 1e9)!.map(match => {
    let {from, to} = match
    return {from, to, insert: query.getReplacement(match)}
  })
  if (!changes.length) return false
  let announceText = view.state.phrase("replaced $ matches", changes.length) + "."
  view.dispatch({
    changes,
    effects: EditorView.announce.of(announceText),
    userEvent: "input.replace.all"
  })
  return true
})

function createSearchPanel(view: EditorView) {
  return view.state.facet(searchConfigFacet).createPanel(view)
}

function defaultQuery(state: EditorState, fallback?: SearchQuery) {
  let sel = state.selection.main
  let selText = sel.empty || sel.to > sel.from + 100 ? "" : state.sliceDoc(sel.from, sel.to)
  if (fallback && !selText) return fallback
  let config = state.facet(searchConfigFacet)
  return new SearchQuery({
    search: (fallback?.literal ?? config.literal) ? selText : selText.replace(/\n/g, "\\n"),
    caseSensitive: fallback?.caseSensitive ?? config.caseSensitive,
    literal: fallback?.literal ?? config.literal,
    regexp: fallback?.regexp ?? config.regexp,
    wholeWord: fallback?.wholeWord ?? config.wholeWord
  })
}

function getSearchInput(view: EditorView) {
  let panel = getPanel(view, createSearchPanel)
  return panel && panel.dom.querySelector("[main-field]") as HTMLInputElement | null
}

function selectSearchInput(view: EditorView) {
  let input = getSearchInput(view)
  if (input && input == view.root.activeElement)
    input.select()
}

/// Make sure the search panel is open and focused.
export const openSearchPanel: Command = view => {
  let state = view.state.field(searchState, false)
  if (state && state.panel) {
    let searchInput = getSearchInput(view)
    if (searchInput && searchInput != view.root.activeElement) {
      let query = defaultQuery(view.state, state.query.spec)
      if (query.valid) view.dispatch({effects: setSearchQuery.of(query)})
      searchInput.focus()
      searchInput.select()
    }
  } else {
    view.dispatch({effects: [
      togglePanel.of(true),
      state ? setSearchQuery.of(defaultQuery(view.state, state.query.spec)) : StateEffect.appendConfig.of(searchExtensions)
    ]})
  }
  return true
}

/// Close the search panel.
export const closeSearchPanel: Command = view => {
  let state = view.state.field(searchState, false)
  if (!state || !state.panel) return false
  let panel = getPanel(view, createSearchPanel)
  if (panel && panel.dom.contains(view.root.activeElement)) view.focus()
  view.dispatch({effects: togglePanel.of(false)})
  return true
}

/// Default search-related key bindings.
///
///  - Mod-f: [`openSearchPanel`](#search.openSearchPanel)
///  - F3, Mod-g: [`findNext`](#search.findNext)
///  - Shift-F3, Shift-Mod-g: [`findPrevious`](#search.findPrevious)
///  - Mod-Alt-g: [`gotoLine`](#search.gotoLine)
///  - Mod-d: [`selectNextOccurrence`](#search.selectNextOccurrence)
export const searchKeymap: readonly KeyBinding[] = [
  {key: "Mod-f", run: openSearchPanel, scope: "editor search-panel"},
  {key: "F3", run: findNext, shift: findPrevious, scope: "editor search-panel", preventDefault: true},
  {key: "Mod-g", run: findNext, shift: findPrevious, scope: "editor search-panel", preventDefault: true},
  {key: "Escape", run: closeSearchPanel, scope: "editor search-panel"},
  {key: "Mod-Shift-l", run: selectSelectionMatches},
  {key: "Mod-Alt-g", run: gotoLine},
  {key: "Mod-d", run: selectNextOccurrence, preventDefault: true},
]

class SearchPanel implements Panel {
  searchField: HTMLInputElement
  replaceField: HTMLInputElement
  caseField: HTMLInputElement
  reField: HTMLInputElement
  wordField: HTMLInputElement
  dom: HTMLElement
  query: SearchQuery

  constructor(readonly view: EditorView) {
    let query = this.query = view.state.field(searchState).query.spec
    this.commit = this.commit.bind(this)

    this.searchField = elt("input", {
      value: query.search,
      placeholder: phrase(view, "Find"),
      "aria-label": phrase(view, "Find"),
      class: "cm-textfield",
      name: "search",
      form: "",
      "main-field": "true",
      onchange: this.commit,
      onkeyup: this.commit
    }) as HTMLInputElement
    this.replaceField = elt("input", {
      value: query.replace,
      placeholder: phrase(view, "Replace"),
      "aria-label": phrase(view, "Replace"),
      class: "cm-textfield",
      name: "replace",
      form: "",
      onchange: this.commit,
      onkeyup: this.commit
    }) as HTMLInputElement
    this.caseField = elt("input", {
      type: "checkbox",
      name: "case",
      form: "",
      checked: query.caseSensitive,
      onchange: this.commit
    }) as HTMLInputElement
    this.reField = elt("input", {
      type: "checkbox",
      name: "re",
      form: "",
      checked: query.regexp,
      onchange: this.commit
    }) as HTMLInputElement
    this.wordField = elt("input", {
      type: "checkbox",
      name: "word",
      form: "",
      checked: query.wholeWord,
      onchange: this.commit
    }) as HTMLInputElement

    function button(name: string, onclick: () => void, content: (Node | string)[]) {
      return elt("button", {class: "cm-button", name, onclick, type: "button"}, content)
    }
    this.dom = elt("div", {onkeydown: (e: KeyboardEvent) => this.keydown(e), class: "cm-search"}, [
      this.searchField,
      button("next", () => findNext(view), [phrase(view, "next")]),
      button("prev", () => findPrevious(view), [phrase(view, "previous")]),
      button("select", () => selectMatches(view), [phrase(view, "all")]),
      elt("label", null, [this.caseField, phrase(view, "match case")]),
      elt("label", null, [this.reField, phrase(view, "regexp")]),
      elt("label", null, [this.wordField, phrase(view, "by word")]),
      ...view.state.readOnly ? [] : [
        elt("br"),
        this.replaceField,
        button("replace", () => replaceNext(view), [phrase(view, "replace")]),
        button("replaceAll", () => replaceAll(view), [phrase(view, "replace all")])
      ],
      elt("button", {
        name: "close",
        onclick: () => closeSearchPanel(view),
        "aria-label": phrase(view, "close"),
        type: "button"
      }, ["×"])
    ])
  }

  commit() {
    let query = new SearchQuery({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      regexp: this.reField.checked,
      wholeWord: this.wordField.checked,
      replace: this.replaceField.value,
    })
    if (!query.eq(this.query)) {
      this.query = query
      this.view.dispatch({effects: setSearchQuery.of(query)})
    }
  }

  keydown(e: KeyboardEvent) {
    if (runScopeHandlers(this.view, e, "search-panel")) {
      e.preventDefault()
    } else if (e.keyCode == 13 && e.target == this.searchField) {
      e.preventDefault()
      ;(e.shiftKey ? findPrevious : findNext)(this.view)
    } else if (e.keyCode == 13 && e.target == this.replaceField) {
      e.preventDefault()
      replaceNext(this.view)
    }
  }

  update(update: ViewUpdate) {
    for (let tr of update.transactions) for (let effect of tr.effects) {
      if (effect.is(setSearchQuery) && !effect.value.eq(this.query)) this.setQuery(effect.value)
    }
  }

  setQuery(query: SearchQuery) {
    this.query = query
    this.searchField.value = query.search
    this.replaceField.value = query.replace
    this.caseField.checked = query.caseSensitive
    this.reField.checked = query.regexp
    this.wordField.checked = query.wholeWord
  }

  mount() {
    this.searchField.select()
  }

  get pos() { return 80 }

  get top() { return this.view.state.facet(searchConfigFacet).top }
}

function phrase(view: EditorView, phrase: string) { return view.state.phrase(phrase) }

const AnnounceMargin = 30

const Break = /[\s\.,:;?!]/

function announceMatch(view: EditorView, {from, to}: {from: number, to: number}) {
  let line = view.state.doc.lineAt(from), lineEnd = view.state.doc.lineAt(to).to
  let start = Math.max(line.from, from - AnnounceMargin), end = Math.min(lineEnd, to + AnnounceMargin)
  let text = view.state.sliceDoc(start, end)
  if (start != line.from) {
    for (let i = 0; i < AnnounceMargin; i++) if (!Break.test(text[i + 1]) && Break.test(text[i])) {
      text = text.slice(i)
      break
    }
  }
  if (end != lineEnd) {
    for (let i = text.length - 1; i > text.length - AnnounceMargin; i--) if (!Break.test(text[i - 1]) && Break.test(text[i])) {
      text = text.slice(0, i)
      break
    }
  }

  return EditorView.announce.of(
    `${view.state.phrase("current match")}. ${text} ${view.state.phrase("on line")} ${line.number}.`)
}

const baseTheme = EditorView.baseTheme({
  ".cm-panel.cm-search": {
    padding: "2px 6px 4px",
    position: "relative",
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "4px",
      backgroundColor: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    },
    "& input, & button, & label": {
      margin: ".2em .6em .2em 0"
    },
    "& input[type=checkbox]": {
      marginRight: ".2em"
    },
    "& label": {
      fontSize: "80%",
      whiteSpace: "pre"
    }
  },

  "&light .cm-searchMatch": { backgroundColor: "#ffff0054" },
  "&dark .cm-searchMatch": { backgroundColor: "#00ffff8a" },

  "&light .cm-searchMatch-selected": { backgroundColor: "#ff6a0054" },
  "&dark .cm-searchMatch-selected": { backgroundColor: "#ff00ff8a" }
})

const searchExtensions = [
  searchState,
  Prec.low(searchHighlighter),
  baseTheme
]

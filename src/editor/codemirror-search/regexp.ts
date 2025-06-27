import {Text, TextIterator} from "@codemirror/state"

const empty = {from: -1, to: -1, match: /.*/.exec("")!}

const baseFlags = "gm" + (/x/.unicode == null ? "" : "u")

export interface RegExpCursorOptions {
  ignoreCase?: boolean
  test?: (from: number, to: number, match: RegExpExecArray) => boolean
}

/// This class is similar to [`SearchCursor`](#search.SearchCursor)
/// but searches for a regular expression pattern instead of a plain
/// string.
export class RegExpCursor implements Iterator<{from: number, to: number, match: RegExpExecArray}> {
  declare private iter: TextIterator
  declare private re: RegExp
  private test?: (from: number, to: number, match: RegExpExecArray) => boolean
  private curLine = ""
  declare private curLineStart: number
  declare private matchPos: number

  /// Set to `true` when the cursor has reached the end of the search
  /// range.
  done = false

  /// Will contain an object with the extent of the match and the
  /// match object when [`next`](#search.RegExpCursor.next)
  /// sucessfully finds a match.
  value = empty

  /// Create a cursor that will search the given range in the given
  /// document. `query` should be the raw pattern (as you'd pass it to
  /// `new RegExp`).
  constructor(private text: Text, query: string, options?: RegExpCursorOptions,
              from: number = 0, private to: number = text.length) {
    if (/\\[sWDnr]|\n|\r|\[\^/.test(query)) return new MultilineRegExpCursor(text, query, options, from, to) as any
    this.re = new RegExp(query, baseFlags + (options?.ignoreCase ? "i" : ""))
    this.test = options?.test
    this.iter = text.iter()
    let startLine = text.lineAt(from)
    this.curLineStart = startLine.from
    this.matchPos = toCharEnd(text, from)
    this.getLine(this.curLineStart)
  }

  private getLine(skip: number) {
    this.iter.next(skip)
    if (this.iter.lineBreak) {
      this.curLine = ""
    } else {
      this.curLine = this.iter.value
      if (this.curLineStart + this.curLine.length > this.to)
        this.curLine = this.curLine.slice(0, this.to - this.curLineStart)
      this.iter.next()
    }
  }

  private nextLine() {
    this.curLineStart = this.curLineStart + this.curLine.length + 1
    if (this.curLineStart > this.to) this.curLine = ""
    else this.getLine(0)
  }

  /// Move to the next match, if there is one.
  next() {
    for (let off = this.matchPos - this.curLineStart;;) {
      this.re.lastIndex = off
      let match = this.matchPos <= this.to && this.re.exec(this.curLine)
      if (match) {
        let from = this.curLineStart + match.index, to = from + match[0].length
        this.matchPos = toCharEnd(this.text, to + (from == to ? 1 : 0))
        if (from == this.curLineStart + this.curLine.length) this.nextLine()
        if ((from < to || from > this.value.to) && (!this.test || this.test(from, to, match))) {
          this.value = {from, to, match}
          return this
        }
        off = this.matchPos - this.curLineStart
      } else if (this.curLineStart + this.curLine.length < this.to) {
        this.nextLine()
        off = 0
      } else {
        this.done = true
        return this
      }
    }
  }

  declare [Symbol.iterator]: () => Iterator<{from: number, to: number, match: RegExpExecArray}>
}

const flattened = new WeakMap<Text, FlattenedDoc>()

// Reusable (partially) flattened document strings
class FlattenedDoc {
  constructor(readonly from: number,
              readonly text: string) {}
  get to() { return this.from + this.text.length }

  static get(doc: Text, from: number, to: number) {
    let cached = flattened.get(doc)
    if (!cached || cached.from >= to || cached.to <= from) {
      let flat = new FlattenedDoc(from, doc.sliceString(from, to))
      flattened.set(doc, flat)
      return flat
    }
    if (cached.from == from && cached.to == to) return cached
    let {text, from: cachedFrom} = cached
    if (cachedFrom > from) {
      text = doc.sliceString(from, cachedFrom) + text
      cachedFrom = from
    }
    if (cached.to < to)
      text += doc.sliceString(cached.to, to)
    flattened.set(doc, new FlattenedDoc(cachedFrom, text))
    return new FlattenedDoc(from, text.slice(from - cachedFrom, to - cachedFrom))
  }
}

const enum Chunk { Base = 5000 }

class MultilineRegExpCursor implements Iterator<{from: number, to: number, match: RegExpExecArray}> {
  private flat: FlattenedDoc
  private matchPos
  private re: RegExp
  private test?: (from: number, to: number, match: RegExpExecArray) => boolean

  done = false
  value = empty

  constructor(private text: Text, query: string, options: RegExpCursorOptions | undefined, from: number, private to: number) {
    this.matchPos = toCharEnd(text, from)
    this.re = new RegExp(query, baseFlags + (options?.ignoreCase ? "i" : ""))
    this.test = options?.test
    this.flat = FlattenedDoc.get(text, from, this.chunkEnd(from + Chunk.Base))
  }

  private chunkEnd(pos: number) {
    return pos >= this.to ? this.to : this.text.lineAt(pos).to
  }

  next() {
    for (;;) {
      let off = this.re.lastIndex = this.matchPos - this.flat.from
      let match = this.re.exec(this.flat.text)
      // Skip empty matches directly after the last match
      if (match && !match[0] && match.index == off) {
        this.re.lastIndex = off + 1
        match = this.re.exec(this.flat.text)
      }
      if (match) {
        let from = this.flat.from + match.index, to = from + match[0].length
        // If a match goes almost to the end of a noncomplete chunk, try
        // again, since it'll likely be able to match more
        if ((this.flat.to >= this.to || match.index + match[0].length <= this.flat.text.length - 10) &&
            (!this.test || this.test(from, to, match))) {
          this.value = {from, to, match}
          this.matchPos = toCharEnd(this.text, to + (from == to ? 1 : 0))
          return this
        }
      }
      if (this.flat.to == this.to) {
        this.done = true
        return this
      }
      // Grow the flattened doc
      this.flat = FlattenedDoc.get(this.text, this.flat.from, this.chunkEnd(this.flat.from + this.flat.text.length * 2))
    }
  }

  declare [Symbol.iterator]: () => Iterator<{from: number, to: number, match: RegExpExecArray}>
}

if (typeof Symbol != "undefined") {
  RegExpCursor.prototype[Symbol.iterator] = MultilineRegExpCursor.prototype[Symbol.iterator] =
    function(this: RegExpCursor) { return this }
}

export function validRegExp(source: string) {
  try {
    new RegExp(source, baseFlags)
    return true
  } catch {
    return false
  }
}

function toCharEnd(text: Text, pos: number) {
  if (pos >= text.length) return pos
  let line = text.lineAt(pos), next
  while (pos < line.to && (next = line.text.charCodeAt(pos - line.from)) >= 0xDC00 && next < 0xE000) pos++
  return pos
}

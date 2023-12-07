export class SelectionChangeEvent extends Event {
    constructor({cursorLine, language, languageAuto, selectionSize}) {
        super("selectionChange")
        this.cursorLine = cursorLine
        this.selectionSize = selectionSize
        this.language = language
        this.languageAuto = languageAuto
    }
}

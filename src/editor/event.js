export class SelectionChangeEvent extends Event {
    constructor({cursorLine, language, languageAuto}) {
        super("selectionChange")
        this.cursorLine = cursorLine
        this.language = language
        this.languageAuto = languageAuto
    }
}

export class SelectionChangeEvent extends Event {
    constructor({cursorLine, language, languageAuto, selectionSize, createdTime, updatedTime}) {
        super("selectionChange")
        this.cursorLine = cursorLine
        this.selectionSize = selectionSize
        this.language = language
        this.languageAuto = languageAuto
        this.createdTime = createdTime
        this.updatedTime = updatedTime
    }
}

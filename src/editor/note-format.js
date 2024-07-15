export class NoteFormat {
    constructor() {
        this.content = '';
        this.metadata = {};
    }

    static load(data) {
        const note = new NoteFormat();

        note.content = data
        const firstSeparator = data.indexOf("\n∞∞∞")
        if (firstSeparator !== -1) {
            const metadataContent = data.slice(0, firstSeparator).trim()
            if (metadataContent !== "") {
                note.metadata = JSON.parse(metadataContent)
            }
            note.content = data.slice(firstSeparator)
        }

        return note
    }

    serialize() {
        this.metadata.formatVersion = "1.0"
        return JSON.stringify(this.metadata) + this.content
    }

    set cursors(cursors) {
        this.metadata.cursors = cursors
    }

    get cursors() {
        return this.metadata.cursors
    }
}

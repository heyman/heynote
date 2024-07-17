import { major } from "semver";


const FORMAT_VERSION = "1.0.0"


export class NoteFormat {
    constructor() {
        this.content = '';
        this.metadata = {formatVersion: "0.0.0"};
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
        
        if (major(note.metadata.formatVersion) > major(FORMAT_VERSION)) {
            throw new Error(`Unsupported Heynote format version: ${note.metadata.formatVersion}. You probably need to update Heynote.`)
        }

        return note
    }

    serialize() {
        this.metadata.formatVersion = FORMAT_VERSION
        return JSON.stringify(this.metadata) + this.content
    }

    set cursors(cursors) {
        this.metadata.cursors = cursors
    }

    get cursors() {
        return this.metadata.cursors
    }
}

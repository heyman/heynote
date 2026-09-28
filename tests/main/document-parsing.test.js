import { describe, expect, it } from "vitest"

import {
    createDocumentTag,
    parseDocumentsFromString,
    formatFileSize,
} from "../../src/editor/document/document-parsing.js"
import { isAllowedDocumentFilename } from "../../src/common/constants.js"

describe("document parsing", () => {
    it("parses document tags with required and optional params", () => {
        const tag = "<∞doc;id=doc-1;file=heynote-file://document/contract.pdf;name=Contract%202026.pdf;size=1048576∞>"
        const content = `before ${tag} after`

        const docs = parseDocumentsFromString(content)

        expect(docs).toHaveLength(1)
        expect(docs[0]).toEqual({
            from: content.indexOf(tag),
            to: content.indexOf(tag) + tag.length,
            id: "doc-1",
            file: "heynote-file://document/contract.pdf",
            name: "Contract 2026.pdf",
            size: 1048576,
        })
    })

    it("falls back to filename from URL if name param is omitted", () => {
        const tag = "<∞doc;id=doc-2;file=heynote-file://document/invoice-report.pdf∞>"
        const docs = parseDocumentsFromString(tag)

        expect(docs).toHaveLength(1)
        expect(docs[0].id).toBe("doc-2")
        expect(docs[0].file).toBe("heynote-file://document/invoice-report.pdf")
        expect(docs[0].name).toBe("invoice-report.pdf")
        expect(docs[0].size).toBeUndefined()
    })

    it("ignores tags missing required params", () => {
        const tag1 = "<∞doc;id=1;file=heynote-file://document/a.pdf∞>"
        const invalid1 = "<∞doc;file=heynote-file://document/b.pdf∞>"
        const invalid2 = "<∞doc;id=3∞>"
        const tag2 = "<∞doc;id=4;file=heynote-file://document/c.docx;name=MyDoc.docx∞>"
        const content = `${tag1} middle ${invalid1} and ${invalid2} tail ${tag2}`

        const docs = parseDocumentsFromString(content)

        expect(docs).toHaveLength(2)
        expect(docs[0].id).toBe("1")
        expect(docs[1].id).toBe("4")
    })

    it("does not leak regex state between calls", () => {
        const tag = "<∞doc;id=1;file=heynote-file://document/a.pdf∞>"
        const first = parseDocumentsFromString(tag)
        const second = parseDocumentsFromString(`prefix ${tag}`)

        expect(first).toHaveLength(1)
        expect(second).toHaveLength(1)
        expect(second[0].from).toBe("prefix ".length)
    })
})

describe("document tag creation", () => {
    it("creates tag with all parameters", () => {
        const doc = {
            id: "doc-1",
            file: "heynote-file://document/contract.pdf",
            name: "My Contract.pdf",
            size: 2048,
        }

        expect(createDocumentTag(doc)).toBe(
            "<∞doc;id=doc-1;file=heynote-file://document/contract.pdf;name=My%20Contract.pdf;size=2048∞>"
        )
    })

    it("creates tag without optional parameters", () => {
        const doc = {
            id: "doc-2",
            file: "heynote-file://document/contract.pdf",
        }

        expect(createDocumentTag(doc)).toBe(
            "<∞doc;id=doc-2;file=heynote-file://document/contract.pdf∞>"
        )
    })
})

describe("formatFileSize", () => {
    it("formats file sizes appropriately", () => {
        expect(formatFileSize(500)).toBe("500 B")
        expect(formatFileSize(1536)).toBe("1.5 KB")
        expect(formatFileSize(1048576 * 2.5)).toBe("2.5 MB")
        expect(formatFileSize(1073741824 * 1.2)).toBe("1.2 GB")
        expect(formatFileSize(undefined)).toBe("")
        expect(formatFileSize(null)).toBe("")
    })
})

describe("isAllowedDocumentFilename", () => {
    it("allows lower risk document extensions", () => {
        expect(isAllowedDocumentFilename("doc.pdf")).toBe(true)
        expect(isAllowedDocumentFilename("REPORT.PDF")).toBe(true)
        expect(isAllowedDocumentFilename("report.docx")).toBe(true)
        expect(isAllowedDocumentFilename("report.doc")).toBe(true)
        expect(isAllowedDocumentFilename("notes.rtf")).toBe(true)
        expect(isAllowedDocumentFilename("sheet.xlsx")).toBe(true)
        expect(isAllowedDocumentFilename("sheet.xls")).toBe(true)
        expect(isAllowedDocumentFilename("data.csv")).toBe(true)
        expect(isAllowedDocumentFilename("data.tsv")).toBe(true)
        expect(isAllowedDocumentFilename("slides.pptx")).toBe(true)
        expect(isAllowedDocumentFilename("slides.ppt")).toBe(true)
        expect(isAllowedDocumentFilename("book.epub")).toBe(true)
        expect(isAllowedDocumentFilename("file.odt")).toBe(true)
        expect(isAllowedDocumentFilename("file.ods")).toBe(true)
        expect(isAllowedDocumentFilename("file.odp")).toBe(true)
        expect(isAllowedDocumentFilename("memo.txt")).toBe(true)
        expect(isAllowedDocumentFilename("readme.md")).toBe(true)
    })

    it("rejects higher risk or executable extensions", () => {
        expect(isAllowedDocumentFilename("malware.exe")).toBe(false)
        expect(isAllowedDocumentFilename("script.sh")).toBe(false)
        expect(isAllowedDocumentFilename("script.bat")).toBe(false)
        expect(isAllowedDocumentFilename("script.cmd")).toBe(false)
        expect(isAllowedDocumentFilename("script.vbs")).toBe(false)
        expect(isAllowedDocumentFilename("script.ps1")).toBe(false)
        expect(isAllowedDocumentFilename("installer.pkg")).toBe(false)
        expect(isAllowedDocumentFilename("image.dmg")).toBe(false)
        expect(isAllowedDocumentFilename("archive.zip")).toBe(false)
        expect(isAllowedDocumentFilename("code.js")).toBe(false)
        expect(isAllowedDocumentFilename("noextension")).toBe(false)
        expect(isAllowedDocumentFilename("")).toBe(false)
        expect(isAllowedDocumentFilename(null)).toBe(false)
    })
})

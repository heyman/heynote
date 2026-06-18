import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { startLibrarySearch } from "../../electron/main/ripgrep.js"

const makeTempDir = () =>
    fs.mkdtempSync(path.join(os.tmpdir(), "heynote-ripgrep-"))

function runLibrarySearch(basePath, options) {
    const events = []
    return new Promise((resolve, reject) => {
        startLibrarySearch({ basePath }, options, (payload) => {
            events.push(payload)
            if (payload.type === "error") {
                reject(new Error(payload.message))
            } else if (payload.type === "done") {
                resolve(events)
            }
        })
    })
}

describe("startLibrarySearch", () => {
    let tmpDir = ""

    beforeEach(() => {
        tmpDir = makeTempDir()
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it("streams fixed-string JSON matches grouped by note file", async () => {
        await fs.promises.mkdir(path.join(tmpDir, "subdir"))
        await fs.promises.mkdir(path.join(tmpDir, ".images"))
        await fs.promises.writeFile(
            path.join(tmpDir, "scratch.txt"),
            "Needle one\naxb should not match\nliteral a.b\n",
            "utf8"
        )
        await fs.promises.writeFile(
            path.join(tmpDir, "subdir", "note.txt"),
            "second needle\n",
            "utf8"
        )
        await fs.promises.writeFile(
            path.join(tmpDir, ".images", "ignored.txt"),
            "needle in hidden image dir\n",
            "utf8"
        )

        const events = await runLibrarySearch(tmpDir, {
            searchId: 123,
            query: "needle",
            caseSensitive: false,
            wholeWord: false,
        })
        const matches = events.filter((event) => event.type === "match")

        expect(matches).toHaveLength(2)
        expect(matches).toEqual(expect.arrayContaining([
            expect.objectContaining({
                searchId: 123,
                buffer: "scratch.txt",
                line: "Needle one",
                lineNumber: 1,
            }),
            expect.objectContaining({
                searchId: 123,
                buffer: path.join("subdir", "note.txt"),
                line: "second needle",
                lineNumber: 1,
            }),
        ]))
    })

    it("uses fixed-string matching instead of regex matching", async () => {
        await fs.promises.writeFile(
            path.join(tmpDir, "scratch.txt"),
            "literal a.b\nregex-looking axb\n",
            "utf8"
        )

        const events = await runLibrarySearch(tmpDir, {
            searchId: 456,
            query: "a.b",
            caseSensitive: true,
            wholeWord: false,
        })
        const matches = events.filter((event) => event.type === "match")

        expect(matches).toHaveLength(1)
        expect(matches[0]).toMatchObject({
            buffer: "scratch.txt",
            line: "literal a.b",
            lineNumber: 1,
        })
    })

    it("supports regex matching when enabled", async () => {
        await fs.promises.writeFile(
            path.join(tmpDir, "scratch.txt"),
            "literal a.b\nregex-looking axb\nregex-looking ayb\n",
            "utf8"
        )

        const events = await runLibrarySearch(tmpDir, {
            searchId: 457,
            query: "a.b",
            caseSensitive: true,
            wholeWord: false,
            regexp: true,
        })
        const matches = events.filter((event) => event.type === "match")

        expect(matches).toHaveLength(3)
        expect(matches.map((match) => match.line)).toEqual([
            "literal a.b",
            "regex-looking axb",
            "regex-looking ayb",
        ])
    })

    it("supports PCRE2-only regex features when regex matching is enabled", async () => {
        await fs.promises.writeFile(
            path.join(tmpDir, "scratch.txt"),
            "ticket-123\nticket-abc\n",
            "utf8"
        )

        const events = await runLibrarySearch(tmpDir, {
            searchId: 459,
            query: "ticket-(?=\\d+)",
            caseSensitive: true,
            wholeWord: false,
            regexp: true,
        })
        const matches = events.filter((event) => event.type === "match")

        expect(matches).toHaveLength(1)
        expect(matches[0]).toMatchObject({
            buffer: "scratch.txt",
            line: "ticket-123",
            lineNumber: 1,
        })
    })

    it("reports invalid regex errors", async () => {
        await fs.promises.writeFile(path.join(tmpDir, "scratch.txt"), "content\n", "utf8")

        await expect(runLibrarySearch(tmpDir, {
            searchId: 458,
            query: "[",
            caseSensitive: true,
            wholeWord: false,
            regexp: true,
        })).rejects.toThrow()
    })

    it("reports submatch offsets as JavaScript string indexes", async () => {
        const line = "🙂🙂 foobar 🙂 foo"
        await fs.promises.writeFile(
            path.join(tmpDir, "scratch.txt"),
            line + "\n",
            "utf8"
        )

        const events = await runLibrarySearch(tmpDir, {
            searchId: 789,
            query: "foo",
            caseSensitive: true,
            wholeWord: true,
        })
        const matches = events.filter((event) => event.type === "match")

        expect(matches).toHaveLength(1)
        expect(matches[0].submatches).toHaveLength(1)
        const [submatch] = matches[0].submatches
        expect(line.slice(submatch.start, submatch.end)).toBe("foo")
        expect(submatch.start).toBe(line.lastIndexOf("foo"))
    })

    it("allows CJK queries shorter than three JavaScript characters", async () => {
        await fs.promises.writeFile(
            path.join(tmpDir, "scratch.txt"),
            "prefix 中文 match\n",
            "utf8"
        )

        const events = await runLibrarySearch(tmpDir, {
            searchId: 790,
            query: "中",
            caseSensitive: true,
            wholeWord: false,
        })
        const matches = events.filter((event) => event.type === "match")

        expect(matches).toHaveLength(1)
        expect(matches[0]).toMatchObject({
            buffer: "scratch.txt",
            line: "prefix 中文 match",
            lineNumber: 1,
            submatches: [{ start: 7, end: 8, text: "中" }],
        })
    })

    it("ignores Heynote metadata, block delimiters, and tags", async () => {
        const tag = "<∞img;id=1;file=https://example.com/needle.png;w=10;h=10∞>"
        const content = [
            JSON.stringify({ formatVersion: "2.0.0", name: "Needle Metadata" }),
            "∞∞∞text-a;created=2026-01-01T00:00:00.000Z",
            `visible needle ${tag} tail`,
            "∞∞∞markdown",
            "after delimiter",
        ].join("\n")
        await fs.promises.writeFile(path.join(tmpDir, "scratch.txt"), content, "utf8")

        const needleEvents = await runLibrarySearch(tmpDir, {
            searchId: 1001,
            query: "needle",
            caseSensitive: false,
            wholeWord: false,
        })
        const needleMatches = needleEvents.filter((event) => event.type === "match")

        expect(needleMatches).toHaveLength(1)
        expect(needleMatches[0]).toMatchObject({
            buffer: "scratch.txt",
            line: `visible needle ${tag} tail`,
            displayLine: "visible needle  tail",
            lineNumber: 3,
            submatches: [{ start: 8, end: 14, text: "needle" }],
            displaySubmatches: [{ start: 8, end: 14, text: "needle" }],
        })

        for (const query of ["metadata", "created", "markdown", "needle.png"]) {
            const events = await runLibrarySearch(tmpDir, {
                searchId: 1002,
                query,
                caseSensitive: false,
                wholeWord: false,
            })
            expect(events.filter((event) => event.type === "match")).toHaveLength(0)
        }
    })
})

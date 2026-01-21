import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SCRATCH_FILE_NAME } from "../../src/common/constants.js"

vi.mock("electron", () => ({
    app: { quit: vi.fn(), getPath: vi.fn() },
    ipcMain: { handle: vi.fn() },
    dialog: { showOpenDialog: vi.fn() },
}))

vi.mock("../../electron/config.js", () => ({
    default: { get: vi.fn(() => "") },
}))

const getImgReferencesMock = vi.fn(async () => [])

const loadFileLibrary = async ({ mockRipgrep = false } = {}) => {
    vi.resetModules()
    if (mockRipgrep) {
        vi.doMock("../../electron/main/ripgrep.js", () => ({
            searchLibrary: vi.fn(),
            getImgReferences: (...args) => getImgReferencesMock(...args),
        }))
    } else {
        vi.unmock("../../electron/main/ripgrep.js")
    }
    return await import("../../electron/main/file-library.js")
}

const makeTempDir = () =>
    fs.mkdtempSync(path.join(os.tmpdir(), "heynote-file-library-"))

describe("FileLibrary", () => {
    let tmpDir = ""
    let library = null

    beforeEach(() => {
        tmpDir = makeTempDir()
        getImgReferencesMock.mockClear()
    })

    afterEach(() => {
        if (library) {
            library.close()
            library = null
        }
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it("creates the scratch file if missing", async () => {
        const { FileLibrary } = await loadFileLibrary()
        library = new FileLibrary(tmpDir, {})
        const scratchPath = path.join(tmpDir, SCRATCH_FILE_NAME)
        expect(fs.existsSync(scratchPath)).toBe(true)
    })

    it("creates, loads, and saves notes", async () => {
        const { FileLibrary } = await loadFileLibrary()
        library = new FileLibrary(tmpDir, {})
        await library.create("note.txt", "hello")
        const content = await library.load("note.txt")
        expect(content).toBe("hello")

        await library.save("note.txt", "updated")
        const updated = fs.readFileSync(path.join(tmpDir, "note.txt"), "utf8")
        expect(updated).toBe("updated")
    })

    it("moves and deletes notes", async () => {
        const { FileLibrary } = await loadFileLibrary()
        library = new FileLibrary(tmpDir, {})
        await library.create("note.txt", "content")
        await library.move("note.txt", "moved.txt")

        expect(fs.existsSync(path.join(tmpDir, "note.txt"))).toBe(false)
        expect(fs.existsSync(path.join(tmpDir, "moved.txt"))).toBe(true)

        await library.delete("moved.txt")
        expect(fs.existsSync(path.join(tmpDir, "moved.txt"))).toBe(false)
    })

    it("rejects deleting the scratch file", async () => {
        const { FileLibrary } = await loadFileLibrary()
        library = new FileLibrary(tmpDir, {})
        await expect(library.delete(SCRATCH_FILE_NAME)).rejects.toThrow(
            "Can't delete scratch file"
        )
    })

    it("returns metadata from getList", async () => {
        const { FileLibrary } = await loadFileLibrary()
        library = new FileLibrary(tmpDir, {})
        const metadata = { name: "Test Note", tags: ["a", "b"] }
        const note = `${JSON.stringify(metadata)}\n∞∞∞text\nbody`

        await fs.promises.writeFile(path.join(tmpDir, "meta.txt"), note, "utf8")
        await fs.promises.writeFile(
            path.join(tmpDir, "plain.txt"),
            "no metadata",
            "utf8"
        )

        const list = await library.getList()
        expect(list["meta.txt"]).toEqual(metadata)
        expect(list["plain.txt"]).toBeNull()
    })

    it("detects changes with NoteBuffer.loadIfChanged", async () => {
        const { FileLibrary, NoteBuffer } = await loadFileLibrary()
        library = new FileLibrary(tmpDir, {})
        const fullPath = path.join(tmpDir, "change.txt")
        await fs.promises.writeFile(fullPath, "first", "utf8")

        const buffer = new NoteBuffer({ fullPath, library })
        await buffer.load()
        expect(await buffer.loadIfChanged()).toBeNull()

        await fs.promises.writeFile(fullPath, "second", "utf8")
        expect(await buffer.loadIfChanged()).toBe("second")
    })

    it("removes unreferenced images older than a day when references exist", async () => {
        const { FileLibrary } = await loadFileLibrary()
        const imagesDir = path.join(tmpDir, ".images")
        await fs.promises.mkdir(imagesDir)

        const referencedImage = "keep.png"
        const orphanImage = "delete.png"
        await fs.promises.writeFile(path.join(imagesDir, referencedImage), "")
        await fs.promises.writeFile(path.join(imagesDir, orphanImage), "")

        const noteContent = `<∞img;id=1;file=heynote-file://image/${referencedImage};w=1;h=1∞>`
        await fs.promises.writeFile(path.join(tmpDir, "note.txt"), noteContent)

        library = new FileLibrary(tmpDir, {})
        const oldTime = new Date(Date.now() - 1000 * 60 * 60 * 25)
        await fs.promises.utimes(
            path.join(imagesDir, orphanImage),
            oldTime,
            oldTime
        )

        await library.removeUnreferencedImages()

        expect(fs.existsSync(path.join(imagesDir, referencedImage))).toBe(true)
        expect(fs.existsSync(path.join(imagesDir, orphanImage))).toBe(false)
    })

    it("keeps unreferenced images when no references exist", async () => {
        const { FileLibrary } = await loadFileLibrary()
        const imagesDir = path.join(tmpDir, ".images")
        await fs.promises.mkdir(imagesDir)

        const orphanImage = "keep.png"
        await fs.promises.writeFile(path.join(imagesDir, orphanImage), "")
        const oldTime = new Date(Date.now() - 1000 * 60 * 60 * 25)
        await fs.promises.utimes(
            path.join(imagesDir, orphanImage),
            oldTime,
            oldTime
        )

        library = new FileLibrary(tmpDir, {})
        await library.removeUnreferencedImages()

        expect(fs.existsSync(path.join(imagesDir, orphanImage))).toBe(true)
    })

    it("keeps images when ripgrep fails", async () => {
        const { FileLibrary } = await loadFileLibrary({ mockRipgrep: true })
        const imagesDir = path.join(tmpDir, ".images")
        await fs.promises.mkdir(imagesDir)

        const orphanImage = "keep.png"
        await fs.promises.writeFile(path.join(imagesDir, orphanImage), "")

        getImgReferencesMock.mockRejectedValueOnce(new Error("rg failed"))

        library = new FileLibrary(tmpDir, {})
        await library.removeUnreferencedImages()

        expect(fs.existsSync(path.join(imagesDir, orphanImage))).toBe(true)
    })
})

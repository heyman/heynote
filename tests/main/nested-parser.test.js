import { describe, expect, it } from "vitest"
import { markdownCodeLanguages } from "../../src/editor/lang-heynote/nested-parser.js"

describe("nested-parser markdownCodeLanguages", () => {
    it("resolves javascript alias", () => {
        expect(markdownCodeLanguages("js")).not.toBeNull()
        expect(markdownCodeLanguages("js").name).toBe("javascript")
        expect(markdownCodeLanguages("javascript").name).toBe("javascript")
    })

    it("resolves python alias", () => {
        expect(markdownCodeLanguages("py")).not.toBeNull()
        expect(markdownCodeLanguages("py").name).toBe("python")
        expect(markdownCodeLanguages("python").name).toBe("python")
    })

    it("resolves shell variants", () => {
        expect(markdownCodeLanguages("sh")).not.toBeNull()
        expect(markdownCodeLanguages("bash")).not.toBeNull()
        expect(markdownCodeLanguages("shell")).not.toBeNull()
    })

    it("resolves c# and c++", () => {
        expect(markdownCodeLanguages("c#")).not.toBeNull()
        expect(markdownCodeLanguages("csharp")).not.toBeNull()
        expect(markdownCodeLanguages("c++")).not.toBeNull()
        expect(markdownCodeLanguages("cpp")).not.toBeNull()
    })

    it("resolves yml to yaml", () => {
        expect(markdownCodeLanguages("yml")).not.toBeNull()
        expect(markdownCodeLanguages("yaml")).not.toBeNull()
    })

    it("returns null for unknown languages", () => {
        expect(markdownCodeLanguages("unknown123")).toBeNull()
    })
})

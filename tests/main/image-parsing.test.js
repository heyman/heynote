import { describe, expect, it } from "vitest"

import {
    createImageTag,
    parseImagesFromString,
} from "../../src/editor/image/image-parsing.js"

describe("image parsing", () => {
    it("parses image tags with required and optional params", () => {
        const tag = "<∞img;id=abc;file=heynote-file://image/test.png;w=1200;h=630;dw=300;dh=200;hidden∞>"
        const content = `before ${tag} after`

        const images = parseImagesFromString(content)

        expect(images).toHaveLength(1)
        expect(images[0]).toEqual({
            from: content.indexOf(tag),
            to: content.indexOf(tag) + tag.length,
            id: "abc",
            file: "heynote-file://image/test.png",
            width: 1200,
            height: 630,
            displayWidth: 300,
            displayHeight: 200,
        })
    })

    it("ignores tags missing required params", () => {
        const tag1 = "<∞img;id=1;file=a.png;w=10;h=20∞>"
        const invalid = "<∞img;id=2;file=b.png;w=10∞>"
        const tag2 = "<∞img;id=3;file=c.png;w=30;h=40;dw=15∞>"
        const content = `${tag1} middle ${invalid} tail ${tag2}`

        const images = parseImagesFromString(content)

        expect(images).toHaveLength(2)
        expect(images[0].id).toBe("1")
        expect(images[1].id).toBe("3")
        expect(images[1].displayWidth).toBe(15)
        expect(images[1].displayHeight).toBeUndefined()
    })

    it("does not leak regex state between calls", () => {
        const tag = "<∞img;id=1;file=a.png;w=10;h=20∞>"
        const first = parseImagesFromString(tag)
        const second = parseImagesFromString(`prefix ${tag}`)

        expect(first).toHaveLength(1)
        expect(second).toHaveLength(1)
        expect(second[0].from).toBe("prefix ".length)
    })
})

describe("image tag creation", () => {
    it("creates tag with display dimensions", () => {
        const image = {
            id: "1",
            file: "heynote-file://image/test.png",
            width: 100,
            height: 200,
            displayWidth: 50,
            displayHeight: 60,
        }

        expect(createImageTag(image)).toBe(
            "<∞img;id=1;file=heynote-file://image/test.png;w=100;h=200;dw=50;dh=60∞>"
        )
    })

    it("omits display dimensions when missing", () => {
        const image = {
            id: "1",
            file: "heynote-file://image/test.png",
            width: 100,
            height: 200,
        }

        expect(createImageTag(image)).toBe(
            "<∞img;id=1;file=heynote-file://image/test.png;w=100;h=200∞>"
        )
    })
})

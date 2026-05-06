import { describe, expect, it } from "vitest"

import { ensureWindowBoundsVisible } from "../../electron/main/window-bounds"

const displays = [
    {
        bounds: { x: 0, y: 0, width: 1440, height: 900 },
        workArea: { x: 0, y: 25, width: 1440, height: 875 },
    },
    {
        bounds: { x: 1440, y: 0, width: 1920, height: 1080 },
        workArea: { x: 1440, y: 0, width: 1920, height: 1040 },
    },
]

describe("ensureWindowBoundsVisible", () => {
    it("keeps bounds that are visible on an attached display", () => {
        const bounds = { x: 1600, y: 100, width: 940, height: 720 }

        expect(ensureWindowBoundsVisible(bounds, displays)).toEqual(bounds)
    })

    it("moves off-screen bounds onto the nearest remaining display", () => {
        const bounds = { x: 3600, y: 100, width: 940, height: 720 }

        expect(ensureWindowBoundsVisible(bounds, displays)).toEqual({
            x: 2420,
            y: 100,
            width: 940,
            height: 720,
        })
    })

    it("keeps bounds that are only partly visible", () => {
        const bounds = { x: -900, y: 100, width: 940, height: 720 }

        expect(ensureWindowBoundsVisible(bounds, displays)).toEqual(bounds)
    })

    it("keeps oversized bounds if any part of the window is visible", () => {
        const bounds = { x: 200, y: 100, width: 2000, height: 1200 }

        expect(ensureWindowBoundsVisible(bounds, displays)).toEqual(bounds)
    })

    it("shrinks off-screen bounds that are larger than the target work area", () => {
        const bounds = { x: 3600, y: 100, width: 2000, height: 1200 }

        expect(ensureWindowBoundsVisible(bounds, displays)).toEqual({
            x: 1440,
            y: 0,
            width: 1920,
            height: 1040,
        })
    })

    it("leaves unpositioned bounds unchanged", () => {
        const bounds = { width: 940, height: 720 }

        expect(ensureWindowBoundsVisible(bounds, displays)).toEqual(bounds)
    })
})

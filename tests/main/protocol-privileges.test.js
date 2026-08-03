import { describe, expect, it } from "vitest"

import { heynoteFileProtocolPrivileges } from "../../electron/main/protocol-privileges"

describe("heynoteFileProtocolPrivileges", () => {
    it("allows CORS fetches of stored images for clipboard copying", () => {
        expect(heynoteFileProtocolPrivileges).toEqual({
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
        })
    })
})

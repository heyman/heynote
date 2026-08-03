import { describe, expect, it, vi } from "vitest"

import {
    enableWaylandGlobalShortcutsPortal,
    updateGlobalHotkeyRegistration,
} from "../../electron/main/global-hotkey"

describe("enableWaylandGlobalShortcutsPortal", () => {
    it("enables the Portal before startup in Linux Wayland sessions", () => {
        const appendSwitch = vi.fn()

        enableWaylandGlobalShortcutsPortal({ commandLine: { appendSwitch } }, true, "wayland")

        expect(appendSwitch).toHaveBeenCalledWith("enable-features", "GlobalShortcutsPortal")
    })

    it("does not enable the Portal outside Linux Wayland sessions", () => {
        const appendSwitch = vi.fn()
        const app = { commandLine: { appendSwitch } }

        enableWaylandGlobalShortcutsPortal(app, false, "wayland")
        enableWaylandGlobalShortcutsPortal(app, true, "x11", "")

        expect(appendSwitch).not.toHaveBeenCalled()
    })

    it("detects Wayland when only WAYLAND_DISPLAY is available", () => {
        const appendSwitch = vi.fn()

        enableWaylandGlobalShortcutsPortal(
            { commandLine: { appendSwitch } },
            true,
            undefined,
            "wayland-0",
        )

        expect(appendSwitch).toHaveBeenCalledWith("enable-features", "GlobalShortcutsPortal")
    })
})

describe("updateGlobalHotkeyRegistration", () => {
    const callback = vi.fn()

    it("unregisters existing hotkeys before registering the configured hotkey", () => {
        const unregisterAll = vi.fn()
        const register = vi.fn(() => true)

        const error = updateGlobalHotkeyRegistration({
            accelerator: "CommandOrControl+Shift+H",
            callback,
            enabled: true,
            globalShortcut: { register, unregisterAll },
        })

        expect(unregisterAll).toHaveBeenCalledOnce()
        expect(register).toHaveBeenCalledWith("CommandOrControl+Shift+H", callback)
        expect(error).toEqual({ success: true })
    })

    it("does not register a disabled hotkey", () => {
        const unregisterAll = vi.fn()
        const register = vi.fn()

        const error = updateGlobalHotkeyRegistration({
            accelerator: "CommandOrControl+Shift+H",
            callback,
            enabled: false,
            globalShortcut: { register, unregisterAll },
        })

        expect(unregisterAll).toHaveBeenCalledOnce()
        expect(register).not.toHaveBeenCalled()
        expect(error).toEqual({ success: true })
    })

    it("returns an actionable error when Electron rejects the hotkey", () => {
        const error = updateGlobalHotkeyRegistration({
            accelerator: "CommandOrControl+Shift+H",
            callback,
            enabled: true,
            globalShortcut: { register: vi.fn(() => false), unregisterAll: vi.fn() },
        })

        expect(error).toEqual({
            success: false,
            message: 'Could not register global hotkey "CommandOrControl+Shift+H". It may already be in use or reserved by the desktop environment.',
        })
    })
})

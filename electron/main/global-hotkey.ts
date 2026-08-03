type AppWithCommandLine = {
    commandLine: {
        appendSwitch: (switchName: string, value?: string) => void
    }
}

type GlobalShortcut = {
    register: (accelerator: string, callback: () => void) => boolean
    unregisterAll: () => void
}

type GlobalHotkeyRegistration = {
    accelerator: string
    callback: () => void
    enabled: boolean
    globalShortcut: GlobalShortcut
}

export type GlobalHotkeyRegistrationResult =
    | { success: true }
    | { success: false, message: string }

export function enableWaylandGlobalShortcutsPortal(
    app: AppWithCommandLine,
    isLinux: boolean,
    sessionType = process.env.XDG_SESSION_TYPE,
    waylandDisplay = process.env.WAYLAND_DISPLAY,
) {
    if (isLinux && (sessionType?.toLowerCase() === "wayland" || waylandDisplay)) {
        app.commandLine.appendSwitch("enable-features", "GlobalShortcutsPortal")
    }
}

export function updateGlobalHotkeyRegistration({
    accelerator,
    callback,
    enabled,
    globalShortcut,
}: GlobalHotkeyRegistration) {
    globalShortcut.unregisterAll()
    if (!enabled || globalShortcut.register(accelerator, callback)) {
        return { success: true }
    }

    return {
        success: false,
        message: `Could not register global hotkey "${accelerator}". It may already be in use or reserved by the desktop environment.`,
    }
}

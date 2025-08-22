export const keyHelpStr = (platform: string, extended: boolean = false) => {
    const modChar = platform === "darwin" ? "⌘" : "Ctrl"
    const altChar = platform === "darwin" ? "⌥" : "Alt"

    const keyHelp = [
        [`${modChar} + Enter`, "Add new block below the current block"],
        [`${altChar} + Enter`, "Add new block before the current block"],
        [`${modChar} + Shift + Enter`, "Add new block at the end of the buffer"],
        [`${altChar} + Shift + Enter`, "Add new block at the start of the buffer"],
        [`${modChar} + ${altChar} + Enter`, "Split the current block at cursor position"],
        [`${modChar} + L`, "Change block language"],
        [`${modChar} + N`, "Create a new note buffer"],
        [`${modChar} + S`, "Move the current block to another (or new) buffer"],
        [`${modChar} + P`, "Open note selector"],
        [`${modChar} + Shift + P`, "Open command palette"],
        [`${modChar} + Down`, "Goto next block"],
        [`${modChar} + Up`, "Goto previous block"],
        [`${modChar} + A`, "Select all text in a note block. Press again to select the whole buffer"],
        [`${modChar} + ${altChar} + Up/Down`, "Add additional cursor above/below"],
        [`${altChar} + Shift + F`, "Format block content (works for JSON, JavaScript, HTML, CSS and Markdown)"],
    ]

    if (extended) {
        keyHelp.push(
            [`${modChar} + ${altChar} + [`, "Fold block(s)"],
            [`${modChar} + ${altChar} + ]`, "Unfold block(s)"],
            [`${modChar} + ${altChar} + .`, "Toggle block fold"],
        )
    }
    
    const keyMaxLength = keyHelp.map(([key]) => key.length).reduce((a, b) => Math.max(a, b))

    return keyHelp.map(([key, help]) => `${key.padEnd(keyMaxLength)}   ${help}`).join("\n")
}
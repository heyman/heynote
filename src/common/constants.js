export const SCRATCH_FILE_NAME = "scratch.txt"
export const AUTO_SAVE_INTERVAL = 2000
export const DEFAULT_LEFT_PANEL_WIDTH = 210

export const WINDOW_CLOSE_EVENT = "window-close"
export const WINDOW_FULLSCREEN_STATE = "window-fullscreen-state"
export const WINDOW_FOCUS_STATE = "window-focus-state"
export const FOCUS_EDITOR_EVENT = "focus-editor"
export const OPEN_SETTINGS_EVENT = "open-settings"
export const SETTINGS_CHANGE_EVENT = "settings-change"
export const REDO_EVENT = "redo"
export const UNDO_EVENT = "undo"
export const MOVE_BLOCK_EVENT = "move-block"
export const DELETE_BLOCK_EVENT = "delete-block"
export const CHANGE_BUFFER_EVENT = "change-buffer"
export const SELECT_ALL_EVENT = "select-all"
export const SAVE_TABS_STATE = "save-tabs-state"
export const LOAD_TABS_STATE = "load-tabs-state"
export const CONTEXT_MENU_CLOSED = "context-menu-closed"
export const GET_SYSTEM_LOCALE = "getSystemLocale"

export const LIBRARY_SEARCH_START = "library-search:start"
export const LIBRARY_SEARCH_CANCEL = "library-search:cancel"
export const LIBRARY_SEARCH_MATCH = "library-search:match"
export const LIBRARY_SEARCH_DONE = "library-search:done"
export const LIBRARY_SEARCH_ERROR = "library-search:error"

export const UPDATE_AVAILABLE_EVENT = "update-available"
export const UPDATE_NOT_AVAILABLE_EVENT = "update-not-available"
export const UPDATE_DOWNLOADED = "update-downloaded"
export const UPDATE_ERROR = "update-error"
export const UPDATE_DOWNLOAD_PROGRESS = "update-download-progress"

export const UPDATE_START_DOWNLOAD = "auto-update:startDownload"
export const UPDATE_INSTALL_AND_RESTART = "auto-update:installAndRestart"
export const UPDATE_CHECK_FOR_UPDATES = "auto-update:checkForUpdates"

export const FOLD_LABEL_LENGTH = 50

export const TITLE_BAR_BG_LIGHT = "#ebebeb"
export const TITLE_BAR_BG_LIGHT_BLURRED = "#e7e7e7"
export const TITLE_BAR_BG_DARK = "#1b1c1d"
export const TITLE_BAR_BG_DARK_BLURRED = "#121313"

export const IMAGE_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/apng",
    "image/avif",
    "image/bmp",
    "image/tiff",
]

export const IMAGE_REGEX = /<∞img;([^∞>]*)∞>/g
export const IMAGE_REGEX_RIPGREP = "<∞img;([^∞>]*)∞>"

export const DOCUMENT_REGEX = /<∞doc;([^∞>]*)∞>/g
export const DOCUMENT_REGEX_RIPGREP = "<∞doc;([^∞>]*)∞>"

export const ALLOWED_DOCUMENT_EXTENSIONS = [
    "doc",
    "docx",
    "dot",
    "dotx",
    "rtf",
    "pdf",
    "xls",
    "xlsx",
    "xlt",
    "xltx",
    "csv",
    "tsv",
    "ppt",
    "pptx",
    "pot",
    "potx",
    "odt",
    "ods",
    "odp",
    "pages",
    "numbers",
    "keynote",
    "txt",
    "md",
    "epub",
]

export function isAllowedDocumentFilename(filename) {
    if (!filename || typeof filename !== "string") {
        return false
    }
    const dotIdx = filename.lastIndexOf(".")
    if (dotIdx === -1 || dotIdx === filename.length - 1) {
        return false
    }
    const ext = filename.slice(dotIdx + 1).toLowerCase()
    return ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)
}


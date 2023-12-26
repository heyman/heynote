import CONFIG from "./config";
import { isMac } from "./detect-platform";

export function onBeforeInputEvent({ win, event, input, currentKeymap }) {
    let metaKey = "alt";
    if (isMac) {
        metaKey = CONFIG.get("settings.emacsMetaKey", "meta");
    }
    if (currentKeymap === "emacs") {
        if (input.code === "KeyY" && input.control) {
            event.preventDefault();
            win.webContents.paste();
        } else if (input.code === "KeyW" && input.control) {
            event.preventDefault();
            win.webContents.cut();
        } else if (input.code === "KeyW" && input[metaKey]) {
            event.preventDefault();
            win.webContents.copy();
        } else if (input.code === "NumpadAdd" && input.control) {
            event.preventDefault();
            // Handle Zoom In functionality
            handleZoomIn(win);
        } else if (input.code === "NumpadSubtract" && input.control) {
            event.preventDefault();
            // Handle Zoom Out functionality
            handleZoomOut(win);
        }
    }
}

function handleZoomIn(win) {
    const { webContents } = win;
    const currentZoomFactor = webContents.getZoomFactor();
    const newZoomFactor = currentZoomFactor + 0.1; // Increase zoom factor by 0.1
    webContents.setZoomFactor(newZoomFactor);
}

function handleZoomOut(win) {
    const { webContents } = win;
    const currentZoomFactor = webContents.getZoomFactor();
    const newZoomFactor = currentZoomFactor - 0.1; // Decrease zoom factor by 0.1
    webContents.setZoomFactor(newZoomFactor);
}

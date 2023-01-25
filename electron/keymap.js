import CONFIG from "./config"
import { isMac } from "./detect-platform"


export function onBeforeInputEvent({win, event, input, currentKeymap}) {
    //console.log("keyboard event", input)
    let metaKey = "alt"
    if (isMac) {
        metaKey = CONFIG.get("emacsMetaKey", "meta")
    }
    if (currentKeymap === "emacs") {
        /**
         * When using Emacs keymap, we can't bind shortcuts for copy, cut and paste in the the renderer process 
         * using Codemirror's bind function. Therefore we have to bind them in electron land, and send 
         * cut, paste and copy to window.webContents
         */
        if (input.code === "KeyY" && input.control) {
            event.preventDefault()
            win.webContents.paste()
        } else if (input.code === "KeyW" && input.control) {
            event.preventDefault()
            win.webContents.cut()
        } else if (input.code === "KeyW" && input[metaKey]) {
            event.preventDefault()
            win.webContents.copy()
        }
    }
}

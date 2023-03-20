import { BrowserWindow } from 'electron'

export function fixElectronCors(win: BrowserWindow) {
    win.webContents.session.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
        },
    );

    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        // check if Access-Control-Allow-Origin header is set to ["*"], and if not, set it to that
        let newHeaders = details.responseHeaders
        let headerAlreadySet = false

        for (const [key, value] of Object.entries(details.responseHeaders)) {
            if (key.toLowerCase() === "access-control-allow-origin") {
                if (value[0] === "*") {
                    headerAlreadySet = true
                }
                break
            }
        }
        if (!headerAlreadySet) {
            newHeaders = {
                "access-control-allow-origin": ["*"],
                ...details.responseHeaders,
            }
        }
        callback({
            responseHeaders: newHeaders,
        });
    });
}

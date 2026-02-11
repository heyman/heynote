import { protocol } from "electron"
import * as path from "node:path"
import * as jetpack from "fs-jetpack"
import * as mimetypes from "mime-types"

let activeFileLibrary = null
let protocolHandlerRegistered = false


export function registerProtocolBeforeAppReady() {
    protocol.registerSchemesAsPrivileged([{
        scheme: "heynote-file",
        privileges: { standard: true, secure: true, supportFetchAPI: true },
    }])
    //console.log("registering heynote-file:// as privileged")
}


export function registerProtocol(fileLibrary) {
    activeFileLibrary = fileLibrary
    if (protocolHandlerRegistered) {
        return
    }

    protocol.handle("heynote-file", async (request) => {
        //console.log("got request:", request)
        if (!activeFileLibrary) {
            return new Response("File library unavailable", { status: 503 })
        }

        // request.url like: heynote-file://image/2026-01-15T21%3A46%3A39.824Z.png
        const url = new URL(request.url);
        const encodedPath = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname
        const filename = decodeURIComponent(encodedPath)
        const filePath = path.join(activeFileLibrary.imagesBasePath, filename);

        const data = await jetpack.readAsync(filePath, "buffer")
        if (!data) {
            return new Response("Not found", { status: 404 })
        }

        const contentType = mimetypes.lookup(filePath) || "application/octet-stream"
        return new Response(data, { headers: { "Content-Type": contentType } })
    })
    protocolHandlerRegistered = true
}

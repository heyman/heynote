import { rgPath } from "@vscode/ripgrep"
import { spawn } from "node:child_process"
import { once } from "node:events"
import readline from "node:readline"

import { IMAGE_REGEX_RIPGREP, IMAGE_REGEX } from "@/src/common/constants.js"
import { parseImagesFromString } from "@/src/editor/image/image-parsing.js"


// If @vscode/ripgrep is in an .asar file, then the binary is unpacked.
const rgDiskPath = rgPath.replace(/app\.asar/, "app.asar.unpacked")


export async function runRipgrep(args, cwd, onLine) {
    //console.log("cwd:", process.cwd(), "args:", args)
    let stdout = ""
    let stderr = ""
    const rg = spawn(rgDiskPath, args, {stdio: ["ignore", "pipe", "pipe"], cwd:cwd})
    rg.stdout.setEncoding("utf8")
    rg.stderr.setEncoding("utf8")
    const rl = readline.createInterface({ input: rg.stdout })
    rl.on("line", (line) => {
        if (!line) return
        //const obj = JSON.parse(line)
        //console.log("line:", line)
        stdout += line + "\n"
        if (onLine) {
            onLine(line)
        }
    })
    //rg.stdout.on("data", (d) => {
    //    console.log("data:", d)
    //    stdout += d
    //})
    rg.stderr.on("data", (d) => {
        stderr += d
    })
    const [code, signal] = await once(rg, "close")
    // ripgrep exits with code 1 if there were not hits
    if (code !== 0 && code !== 1) {
        const err = new Error(`Command failed: ${rgDiskPath}}`)
        err.code = code
        err.signal = signal
        err.stdout = stdout
        err.stderr = stderr
        throw err
    }
    return { code, signal, stdout, stderr }
}


/*
export async function searchLibrary(library, query) {
    if (!library.basePath) {
        throw Error("library.basePath not set, is library initialized?")
    }

    const cmdResult = await runRipgrep(["--byte-offset", query], library.basePath)

    const results = []
    for (let line of cmdResult.stdout.split("\n")) {
        if (line === "") {
            continue
        }
        if (!line.startsWith(library.basePath + "/" )) {
            console.error("Unexpected outout from ripgrep:" + line)
        }
        line = line.substr(library.basePath.length + 1)
        const idx = line.indexOf(":")
        results.push([line.substr(0, idx), line.substr(idx + 1)])
    }
    return results
}*/


export async function getImgReferences(basePath) {
    if (!basePath) {
        throw Error("basePath not set, is library initialized?")
    }
    const imageFiles = []
    const onLine = (line) => {
        const data = JSON.parse(line)
        switch (data.type) {
            case "match":
                const matchedLine = data.data.lines.text
                for (const image of parseImagesFromString(matchedLine)) {
                    const file = decodeURIComponent(image.file)
                    if (!file.startsWith("heynote-file://image/")) {
                        console.error("Unknown image path: " + image.file)
                        continue
                    }
                    imageFiles.push(file.substring("heynote-file://image/".length))
                }
        }
    }
    const result = await runRipgrep(["--json", IMAGE_REGEX_RIPGREP], basePath, onLine)
    return imageFiles
}


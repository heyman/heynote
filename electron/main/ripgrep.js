import { rgPath } from "@vscode/ripgrep"
import { spawn } from "node:child_process"
import { once } from "node:events"
import readline from "node:readline"

import { IMAGE_REGEX_RIPGREP } from "@/src/common/constants.js"
import { isLibrarySearchQueryLongEnough } from "@/src/common/library-search-query.js"
import { normalizeLibrarySearchMatch } from "@/src/common/library-search-match.js"
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

function normalizeRipgrepPath(path) {
    if (!path) {
        return ""
    }
    if (path.startsWith("./") || path.startsWith(".\\")) {
        return path.substring(2)
    }
    return path
}

function utf8ByteOffsetToStringIndex(text, targetOffset) {
    if (targetOffset <= 0) {
        return 0
    }
    let byteOffset = 0
    let stringIndex = 0
    for (const codePoint of text) {
        if (byteOffset >= targetOffset) {
            return stringIndex
        }
        byteOffset += Buffer.byteLength(codePoint)
        stringIndex += codePoint.length
        if (byteOffset >= targetOffset) {
            return stringIndex
        }
    }
    return text.length
}

export function startLibrarySearch(library, options, onEvent) {
    if (!library?.basePath) {
        throw Error("library.basePath not set, is library initialized?")
    }
    const query = options?.query || ""
    if (!isLibrarySearchQueryLongEnough(query)) {
        throw Error("Search query is too short")
    }

    const args = [
        "--json",
        "--line-number",
        "--column",
        "--glob",
        "*.txt",
        "--glob",
        "!.images/**",
    ]
    if (options.regexp) {
        args.push("--pcre2")
    } else {
        args.push("--fixed-strings")
    }
    if (!options.caseSensitive) {
        args.push("--ignore-case")
    }
    if (options.wholeWord) {
        args.push("--word-regexp")
    }
    args.push("--", query, ".")

    let stderr = ""
    let killed = false
    const rg = spawn(rgDiskPath, args, { stdio: ["ignore", "pipe", "pipe"], cwd: library.basePath })
    rg.stdout.setEncoding("utf8")
    rg.stderr.setEncoding("utf8")

    const emit = (payload) => {
        onEvent?.({
            searchId: options.searchId,
            ...payload,
        })
    }

    const rl = readline.createInterface({ input: rg.stdout })
    rl.on("line", (line) => {
        if (!line) {
            return
        }
        let data
        try {
            data = JSON.parse(line)
        } catch (error) {
            emit({ type: "error", message: error.message })
            return
        }
        if (data.type !== "match") {
            return
        }
        const matchData = data.data
        const matchedLine = (matchData.lines?.text || "").replace(/\r?\n$/, "")
        const normalizedMatch = normalizeLibrarySearchMatch({
            line: matchedLine,
            lineNumber: matchData.line_number,
            submatches: (matchData.submatches || []).map((submatch) => ({
                start: utf8ByteOffsetToStringIndex(matchedLine, submatch.start),
                end: utf8ByteOffsetToStringIndex(matchedLine, submatch.end),
                text: submatch.match?.text || "",
            })),
        })
        if (!normalizedMatch) {
            return
        }
        emit({
            type: "match",
            buffer: normalizeRipgrepPath(matchData.path?.text),
            ...normalizedMatch,
        })
    })
    rg.stderr.on("data", (data) => {
        stderr += data
    })
    rg.on("error", (error) => {
        emit({ type: "error", message: error.message })
    })
    rg.on("close", (code, signal) => {
        rl.close()
        if (killed) {
            emit({ type: "done", cancelled: true })
            return
        }
        // ripgrep exits with code 1 if there were no hits
        if (code !== 0 && code !== 1) {
            emit({
                type: "error",
                code,
                signal,
                message: stderr || `ripgrep exited with code ${code}`,
            })
            return
        }
        emit({ type: "done" })
    })

    return {
        kill() {
            killed = true
            if (!rg.killed) {
                rg.kill()
            }
        },
    }
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

import { heynoteEvent, IMAGE_RESIZE } from "../annotation.js"

export const IMAGE_REGEX = /<∞img;([^∞>]*)∞>/g

export const WIDGET_TAG_REGEX = /<∞.*?∞>/g
export const WIDGET_TAG_REGEX_NON_GLOBAL = /<∞.*?∞>/

const requiredParams = ["id", "file", "w", "h"]

export function parseImages(state) {
    const content = state.doc.sliceString(0, state.doc.length)
    return parseImagesFromString(content)
}


/**
 * Parse img tags in the following format:
 * 
 * <∞img;id=2d45d5f5-f912-4a8b-817f-ab14a349e585;file=https://heynote.com/img/share.png;w=1200;h=630;dw=324;dh=170∞>
 */
export function parseImagesFromString(content) {
    let match
    const images = []
    while ((match = IMAGE_REGEX.exec(content)) !== null) {
        try {
            const rawParams = match[1]
            const params = {}
            // split on ; but ignore empty parts
            for (const part of rawParams.split(";")) {
                if (!part) {
                    continue
                }
                const eqIdx = part.indexOf("=");
                if (eqIdx === -1) {
                    // support flags like ;hidden; etc
                    params[part] = true
                    continue
                }

                const key = part.slice(0, eqIdx)
                const value = part.slice(eqIdx + 1)
                params[key] = value
            }
            if (requiredParams.every(p => Object.hasOwn(params, p))) {
                images.push({
                    from: match.index,
                    to: match.index + match[0].length,
                    id: params.id,
                    file: params.file,
                    width: Number(params.w),
                    height: Number(params.h),
                    displayWidth: params.dw ? Number(params.dw) : undefined,
                    displayHeight: params.dh ? Number(params.dh) : undefined,
                })
            }
        } catch (err) {
            const message = err?.message ?? String(err)
            console.error(`Bad <∞img> tag at index ${match.index}: ${message}. Tag: ${match[0]}`)
        }
    }

    return images
    
}


export function createImageTag(image) {
    const params = [
        "id=" + image.id,
        "file=" + image.file,
        "w=" + image.width,
        "h=" + image.height,
    ]
    if (image.displayWidth)
        params.push("dw=" + image.displayWidth)
    if (image.displayHeight)
        params.push("dh=" + image.displayHeight)

    return "<∞img;" + params.join(";") + "∞>"
}


/**
 * Update display width/height parameters (dw/dh) of an img tag
 * 
 * @param {EditorView} view CodeMirror view
 * @param {*} from Start of img tag
 * @param {*} to End of img tag
 * @param {*} width The new display width
 * @param {*} height The new display height
 */
export function setImageDisplayDimensions(view, id, width, height) {
    const images = Object.fromEntries(parseImages(view.state).map(img => [img.id, img]))
    
    if (Object.hasOwn(images, id)) {
        const image = images[id]
        image.displayWidth = width
        image.displayHeight = height

        view.dispatch(view.state.update({
            changes: {
                from: image.from,
                to: image.to,
                insert: createImageTag(image),
            },
            annotations: [heynoteEvent.of(IMAGE_RESIZE)],
        }))
    }
}

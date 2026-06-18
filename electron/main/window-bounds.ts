export type WindowBounds = {
    width: number
    height: number
    x?: number
    y?: number
}

export type RectangleBounds = {
    x: number
    y: number
    width: number
    height: number
}

export type DisplayBounds = {
    bounds: RectangleBounds
    workArea: RectangleBounds
}

function hasPosition(bounds: WindowBounds): bounds is Required<WindowBounds> {
    return bounds.x !== undefined && bounds.y !== undefined
}

function intersects(a: Required<WindowBounds>, b: RectangleBounds) {
    const left = Math.max(a.x, b.x)
    const right = Math.min(a.x + a.width, b.x + b.width)
    const top = Math.max(a.y, b.y)
    const bottom = Math.min(a.y + a.height, b.y + b.height)

    return right > left && bottom > top
}

function distanceFromPointToRect(point: { x: number, y: number }, rect: RectangleBounds) {
    const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width))
    const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height))
    return (dx * dx) + (dy * dy)
}

function getNearestDisplay(bounds: Required<WindowBounds>, displays: DisplayBounds[]) {
    const center = {
        x: bounds.x + (bounds.width / 2),
        y: bounds.y + (bounds.height / 2),
    }

    return displays.reduce((nearest, display) => {
        const nearestDistance = distanceFromPointToRect(center, nearest.bounds)
        const displayDistance = distanceFromPointToRect(center, display.bounds)
        return displayDistance < nearestDistance ? display : nearest
    })
}

function clampToWorkArea(bounds: Required<WindowBounds>, workArea: RectangleBounds): Required<WindowBounds> {
    const width = Math.min(bounds.width, workArea.width)
    const height = Math.min(bounds.height, workArea.height)

    return {
        width,
        height,
        x: Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width),
        y: Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height),
    }
}

export function ensureWindowBoundsVisible(bounds: WindowBounds, displays: DisplayBounds[]): WindowBounds {
    if (!hasPosition(bounds) || displays.length === 0) {
        return bounds
    }

    if (displays.some((display) => intersects(bounds, display.bounds))) {
        return bounds
    }

    const targetDisplay = getNearestDisplay(bounds, displays)
    return clampToWorkArea(bounds, targetDisplay.workArea)
}

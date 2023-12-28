

const THIS_YEAR = (new Date()).getFullYear()

export const getTime = () => {
    // Return time in ISO8601 string YYYY-MM-DDTHH:mm:ssZ
    return (new Date()).toISOString().replace(/\.\d+Z/,'Z')
}

export const newCreatedTime = () => {
    return `-c${getTime()}`
}

export const newUpdatedTime = () => {
    return `-u${getTime()}`
}

export const newCreatedUpdatedTime = () => {
    return `${newCreatedTime()}${newUpdatedTime()}`
}

export const timeMatcher = '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z)'

export const displayTime = (t) => {
    if (!t) return ""

    // create Date object from delimiter time string
    const dt = new Date(t.slice(2,))

    // Present year if its not equal to this one
    if (dt.getFullYear() !== THIS_YEAR) {
        return `${dt.toTimeString().slice(0,5)} ${dt.toDateString().slice(4, 10)}, ${dt.getFullYear()}`
    }

    return `${dt.toTimeString().slice(0,5)} ${dt.toDateString().slice(4, 10)}`
}



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

export const getCreatedTime = () => {
}

export const getUpdatedTime = () => {
}

export const timeMatcher = '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z)'

export const displayTime = (t) => {
    if (!t) return ""

    const dt = new Date(t)
    return `${dt.toTimeString().slice(0,5)} ${dt.toDateString().slice(4, 10)}`
}

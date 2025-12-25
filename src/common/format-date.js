export function formatDate(date, locale) {
    const now = new Date();

    // normalize to local midnight for date-only comparison
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfGiven = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfToday - startOfGiven) / (1000 * 60 * 60 * 24));

    // Today: show just time
    if (diffDays === 0) {
        return date.toLocaleTimeString(locale, {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    // Yesterday: show "Yesterday, <time>"
    if (diffDays === 1) {
        const time = date.toLocaleTimeString(locale, {
            hour: "numeric",
            minute: "2-digit"
        });
        return `Yesterday, ${time}`;
    }

    // Otherwise: full date + time, omit year if same
    const sameYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleString(locale, {
        year: sameYear ? undefined : "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

export function formatFullDate(date, locale) {
    return date.toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatFullDateWithoutSeconds(date, locale) {
    return date.toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
     });
}

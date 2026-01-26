export function toSafeBrowserLocale(locale) {
    // first attempt: maybe it's already fine
    try {
        return Intl.getCanonicalLocales(locale)[0];
    } catch { }

    //  underscores -> hyphens (en_US -> en-US)
    locale = locale.replace(/_/g, "-")
    // drop ".UTF-8", ".utf8", etc.
    locale = locale.replace(/\.[A-Za-z0-9_-]+$/, "")

    // If there's an ICU/POSIX modifier like @calendar=... or @euro, we must drop it 
    // (Intl doesn’t understand "@...").
    locale = locale.split("@", 1)[0];

    // try again after normalization
    try {
        return Intl.getCanonicalLocales(locale)[0]
    } catch { }

    // last resort
    return navigator.language
}

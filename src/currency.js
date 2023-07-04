let currenciesLoaded = false
export async function loadCurrencies() {
    const data = await window.heynote.getCurrencyData()
    if (!currenciesLoaded)
        math.createUnit(data.base, {override:currenciesLoaded, aliases:[data.base.toLowerCase()]})
    Object.keys(data.rates)
        .filter(function (currency) {
            return currency !== data.base
        })
        .forEach(function (currency) {
            math.createUnit(currency, {
                definition: math.unit(1 / data.rates[currency], data.base),
                aliases: currency === "CUP" ? [] : [currency.toLowerCase()], // Lowercase CUP clashes with the measurement unit cup
            }, {override: currenciesLoaded})
        })
    currenciesLoaded = true
    window.document.dispatchEvent(new Event("currenciesLoaded"))
}

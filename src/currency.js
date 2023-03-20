let currenciesLoaded = false
export async function loadCurrencies() {
    const data = await window.heynote.getCurrencyData()
    if (!currenciesLoaded)
        math.createUnit(data.base, {override:currenciesLoaded, aliases:[]})
    Object.keys(data.rates)
        .filter(function (currency) {
            return currency !== data.base
        })
        .forEach(function (currency) {
            math.createUnit(currency, {
                definition: math.unit(1 / data.rates[currency], data.base),
                aliases: [],
            }, {override: currenciesLoaded})
        })
    currenciesLoaded = true
}

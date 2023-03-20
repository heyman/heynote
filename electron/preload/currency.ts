import CONFIG from "../config"

const STALE_TIME = 1000 * 3600 * 12

export default async function getCurrencyData() {
    const currency = CONFIG.get("currency")
    if (currency?.timeFetched && (new Date()).getTime() - currency.timeFetched < STALE_TIME) {
        // we already have currency data and it's not stale
        return currency.data
    } else {
        // we either don't have currency data, or it's stale
        let response
        try {
            response = await fetch("https://currencies.heynote.com/rates.json", {cache: "no-cache"})
        } catch(err) {
            // if we got an error, but have stale currency data, we'll use that
            if (currency?.data) {
                return currency.data
            }
        }

        if (response.ok) {
            const data = JSON.parse(await response.text())
            CONFIG.set("currency", {
                data,
                timeFetched: (new Date()).getTime(),
            })
            return data
        } else {
            // if we got an error, but have stale currency data, we'll use that
            console.log("Error retrieving currency data:", response)
            if (currency?.data) {
                return currency.data
            }
        }
    }
}

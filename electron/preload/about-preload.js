import { ipcRenderer } from "electron"
import CONFIG from "../config"

ipcRenderer.on("init", function (evt, data) {
    document.getElementById("version").innerText = data.version;
    
    let currency = CONFIG.get("currency")
    if (currency && currency.data && currency.data.timestamp) {
        const date = new Date(currency.data.timestamp * 1000);
        document.getElementById("currencyTimestamp").innerText = date.toLocaleString()
    }
});


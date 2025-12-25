import { useHeynoteStore } from "@/src/stores/heynote-store"
import { formatFullDateWithoutSeconds } from "../common/format-date"


export const insertDateAndTime = ({ state, dispatch }) => {
    if (state.readOnly) {
        return false
    }

    const heynoteStore = useHeynoteStore()
    const dateText = formatFullDateWithoutSeconds(new Date(), heynoteStore.systemLocale)

    dispatch(state.replaceSelection(dateText),
        {
            scrollIntoView: true,
            userEvent: "input",
        }
    )
    return true;
}

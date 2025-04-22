export const insertDateAndTime = ({ state, dispatch }) => {
    if (state.readOnly) {
        return false
    }

    const dateText = new Date().toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
    dispatch(state.replaceSelection(dateText),
        {
            scrollIntoView: true,
            userEvent: "input",
        }
    )
    return true;
}

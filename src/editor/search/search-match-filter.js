import { delimiterRegexWithoutNewline } from "../block/block.js"


export function searchTestFunction(onlyCurrentBlock, currentBlock) {
    return (from, to, buffer, bufferPos) => {
        return !delimiterRegexWithoutNewline.test(buffer) && (
            onlyCurrentBlock ? from >= currentBlock.content.from && to <= currentBlock.content.to : true
        )
    }    
}

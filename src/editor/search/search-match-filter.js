import { delimiterRegexWithoutNewline } from "../block/block.js"
import { WIDGET_TAG_REGEX } from "../image/image-parsing.js"


export function searchTestFunction(onlyCurrentBlock, currentBlock) {
    return (from, to, buffer, bufferPos) => {
        //console.log("buffer:", buffer, bufferPos, "from:", from, "to:", to)
        
        let localFrom = from - bufferPos, localTo = to - bufferPos
        const imageMatches = buffer.matchAll(WIDGET_TAG_REGEX)
        for (let match of imageMatches) {
            //console.log("match:", match, "localFrom:", localFrom, "localTo:", localTo, "index:", match.index, "length:", match[0].length)
            
            // if bufferPos is undefined, it means that the searchTestFunction is used as argument for regexpTest and then 
            // we don't have the
            if (localFrom < match[0].length || localTo < match.index) {
                return false
            }
        }

        return !delimiterRegexWithoutNewline.test(buffer) && (
            onlyCurrentBlock ? from >= currentBlock.content.from && to <= currentBlock.content.to : true
        )
    }    
}

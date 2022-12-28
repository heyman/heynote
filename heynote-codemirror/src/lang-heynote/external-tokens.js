import { ExternalTokenizer } from '@lezer/lr'
import { NoteContent } from "./parser.terms.js"

const EOF = -1;

export const noteContent = new ExternalTokenizer((input) => {
    let current = input.peek(0);
    let next = input.peek(1);

    if (current === EOF) {
        return;
    }

    while (true) {
        let potentialLang = "";
        for (let i=0; i<15; i++) {
            potentialLang += String.fromCharCode(input.peek(i));
        }
        if (potentialLang.match(/^∞∞∞(text|javascript|json|python|html|sql|markdown|java|lezer|php)\n/g)) {
            input.acceptToken(NoteContent);
            return;
        }
        if (next === EOF) {
            input.acceptToken(NoteContent, 1);
            return;
        }
        
        current = input.advance();
        next = input.peek(1);
    }
});

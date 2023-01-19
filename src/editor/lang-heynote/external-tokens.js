import { ExternalTokenizer } from '@lezer/lr'
import { NoteContent } from "./parser.terms.js"
import { LANGUAGES } from '../languages.js';

const EOF = -1;

const FIRST_TOKEN_CHAR = "\n".charCodeAt(0)
const SECOND_TOKEN_CHAR = "∞".charCodeAt(0)

const languageTokensMatcher = LANGUAGES.map(l => l.token).join("|")
const tokenRegEx = new RegExp(`^\\n∞∞∞(${languageTokensMatcher})(-a)?\\n`, "g")

export const noteContent = new ExternalTokenizer((input) => {
    let current = input.peek(0);
    let next = input.peek(1);

    if (current === EOF) {
        return;
    }

    while (true) {
        // unless the first two characters are a newline and a "∞" character, we don't have a note content token
        // so we don't need to check for the rest of the token
        if (current === FIRST_TOKEN_CHAR && next === SECOND_TOKEN_CHAR) {
            let potentialLang = "";
            for (let i=0; i<18; i++) {
                potentialLang += String.fromCharCode(input.peek(i));
            }
            if (potentialLang.match(tokenRegEx)) {
                input.acceptToken(NoteContent);
                return;
            }
        }
        if (next === EOF) {
            input.acceptToken(NoteContent, 1);
            return;
        }
        current = input.advance(1);
        next = input.peek(1);
    }
});

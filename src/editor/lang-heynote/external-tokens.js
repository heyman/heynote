import { ExternalTokenizer } from '@lezer/lr'
import { NoteContent } from "./parser.terms.js"
import { LANGUAGES } from '../languages.js';

const EOF = -1;

const FIRST_TOKEN_CHAR = "\n".charCodeAt(0)
const SECOND_TOKEN_CHAR = "∞".charCodeAt(0)

// Build a regex that matches a full note delimiter, including optional -a,
// optional metadata (";key=value" style), and optional trailing "∞∞∞"
//
//   \n∞∞∞(LANG)(-a)?(;...)* \n
//
const languageTokensMatcher = LANGUAGES.map(l => l.token).join("|")
// Metadata is parsed as one or more `;...` segments that must not contain
// a newline or "∞" (so we don't eat the closing mark or line break).
const tokenRegEx = new RegExp(
    `^\\n∞∞∞(${languageTokensMatcher})(-a)?(?:;[^∞\\n]+)*\\n`
)

const HEADER_MAX_LOOKAHEAD = 256

export const noteContent = new ExternalTokenizer((input) => {
    let current = input.peek(0);
    let next = input.peek(1);

    if (current === EOF) {
        return;
    }

    while (true) {
        // unless the first two characters are a newline and a "∞" character,
        // we don't have a note delimiter, so we don't need to check for the rest
        if (current === FIRST_TOKEN_CHAR && next === SECOND_TOKEN_CHAR) {
            // Read ahead up to the end of the potential delimiter line (or a safe max)
            let potentialHeader = "";
            let i = 0;

            while (i < HEADER_MAX_LOOKAHEAD) {
                const ch = input.peek(i);
                if (ch === EOF) break;

                potentialHeader += String.fromCharCode(ch);

                // We started on a '\n' (at i === 0). A second '\n' means we've
                // reached the end of the delimiter line: "\n∞∞∞...\n"
                if (i > 0 && ch === FIRST_TOKEN_CHAR) {
                    break;
                }

                i++;
            }

            if (potentialHeader.match(tokenRegEx)) {
                // End the current NoteContent just before this delimiter
                input.acceptToken(NoteContent);
                return;
            }
        }

        if (next === EOF) {
            // Consume until EOF as NoteContent
            input.acceptToken(NoteContent, 1);
            return;
        }

        current = input.advance(1);
        next = input.peek(1);
    }
});

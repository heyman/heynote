import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';


// Colors from https://www.nordtheme.com/docs/colors-and-palettes
// Polar Night
const base00 = '#2e3440', // black
base01 = '#3b4252', // dark grey
base02 = '#434c5e', base03 = '#4c566a'; // grey
// Snow Storm
const base04 = '#d8dee9', // grey
base05 = '#e5e9f0', // off white
base06 = '#eceff4'; // white
// Frost
const base07 = '#8fbcbb', // moss green
base08 = '#88c0d0', // ice blue
base09 = '#81a1c1', // water blue
base0A = '#5e81ac'; // deep blue
// Aurora
const base0b = '#bf616a', // red
base0C = '#d08770', // orange
base0D = '#ebcb8b', // yellow
base0E = '#a3be8c', // green
base0F = '#b48ead'; // purple
const invalid = '#d30102', darkBackground = '#252a33', background = '#1e222a', tooltipBackground = base01, cursor = '#fff';
const highlightBackground = 'rgba(255,255,255,0.04)';

const lineNumberColor = 'rgba(255,255,255, 0.15)';
const commentColor = '#888d97';
const matchingBracket = 'rgba(255,255,255,0.1)';
const selection = "#0865a9aa";
const selectionBlur = "#225377aa";


const darkTheme = EditorView.theme({
    '&': {
        color: base04,
        backgroundColor: background
    },
    '.cm-content': {
        caretColor: cursor,
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: cursor },
    '.cm-selectionBackground': {
        backgroundColor: selectionBlur,
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: selection,
    },
    '.cm-activeLine.heynote-empty-block-selected': {
        "background-color": selection,
    },
    '.cm-panels': {
        backgroundColor: "#474747", 
        color: "#9c9c9c",
    },
    ".cm-panels .cm-panel": {
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    },
    '.cm-panels .cm-textfield': {
        backgroundColor: "#3b3b3b",
        border: "1px solid #5a5a5a",
        color: "#fff",
    },
    '.cm-panels .cm-textfield:focus': {
        border: "1px solid #48b57e",
        outline: "1px solid #48b57e",
    },
    '.cm-panels .cm-button': {
        background: "#5f5f5f",
        color: "rgba(255,255,255, 0.6)",
        border: "none",
    },
    ".cm-panel.cm-search [name=close]" : {
        color: "rgba(255,255,255, 0.8)",
    },
    '.cm-panels.cm-panels-top': { borderBottom: '2px solid black' },
    
    '.cm-searchMatch': {
        backgroundColor: 'transparent',
        outline: `1px solid ${base07}`
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: base04,
        color: base00
    },
    '.cm-activeLine': { backgroundColor: highlightBackground },
    '.cm-selectionMatch': {
        backgroundColor: "#50606D",
        //color: base01
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        outline: `0.5px solid ${base07}`
    },
    '&.cm-focused .cm-matchingBracket': {
        backgroundColor: matchingBracket,
        color: "inherit",
    },
    '&.cm-focused .cm-nonmatchingBracket': {
        outline: `0.5px solid #bc8f8f`
    },
    '.cm-gutters': {
        //backgroundColor: base00,
        backgroundColor: 'rgba(0,0,0, 0.1)',
        //backgroundColor: 'transparent',
        color: lineNumberColor,
        border: 'none',
    },
    '.cm-activeLineGutter': {
        backgroundColor: "transparent",
        color: 'rgba(255,255,255, 0.6)'
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ddd'
    },
    '.cm-tooltip': {
        border: 'none',
        backgroundColor: tooltipBackground
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: tooltipBackground,
        borderBottomColor: tooltipBackground
    },
    '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
            backgroundColor: highlightBackground,
            color: base03
        }
    },
    ".heynote-blocks-layer .block-even": {
        background: "#252B37",
        borderTop: "1px solid #1e222a",
    },
    ".heynote-blocks-layer .block-odd": {
        //background: "#222f38",
        background: "#213644",
        borderTop: "1px solid #1e222a",
    },
    ".heynote-math-result .inner": {
        background: "#0e1217",
        color: "#a0e7c7",
        boxShadow: '0 0 3px rgba(0,0,0, 0.3)',
    },
    '.heynote-math-result-copied': {
        color: "rgba(220,240,230, 1.0)",
    },
}, { dark: true });

/**
The highlighting styles for the dark theme.
*/
const darkHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: base0A },
    {
        tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName],
        color: base08
    },
    { tag: [tags.variableName], color: base07 },
    { tag: [tags.function(tags.variableName)], color: base07 },
    { tag: [tags.labelName], color: base09 },
    {
        tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
        color: base0A
    },
    { tag: [tags.definition(tags.name), tags.separator], color: base0E },
    { tag: [tags.brace], color: base07 },
    {
        tag: [tags.annotation],
        color: invalid
    },
    {
        tag: [tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace],
        color: base0F
    },
    {
        tag: [tags.typeName, tags.className],
        color: base0D
    },
    {
        tag: [tags.operator, tags.operatorKeyword],
        color: base0E
    },
    {
        tag: [tags.tagName],
        color: base0F
    },
    {
        tag: [tags.squareBracket],
        color: base0b
    },
    {
        tag: [tags.angleBracket],
        color: base0C
    },
    {
        tag: [tags.attributeName],
        color: base0D
    },
    {
        tag: [tags.regexp],
        color: base0A
    },
    {
        tag: [tags.quote],
        color: base0F
    },
    { tag: [tags.string], color: base0E },
    {
        tag: tags.link,
        color: base0E,
        textDecoration: 'underline',
        textUnderlinePosition: 'under'
    },
    {
        tag: [tags.url, tags.escape, tags.special(tags.string)],
        color: base07
    },
    { tag: [tags.meta], color: base08 },
    { tag: [tags.monospace], color: base04, fontStyle: 'italic' },
    { tag: [tags.comment], color: commentColor, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold', color: base0A },
    { tag: tags.emphasis, fontStyle: 'italic', color: base0A },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.heading, fontWeight: 'bold', color: base0A },
    { tag: tags.special(tags.heading1), fontWeight: 'bold', color: base0A },
    { tag: tags.heading1, fontWeight: 'bold', color: base0A },
    {
        tag: [tags.heading2, tags.heading3, tags.heading4],
        fontWeight: 'bold',
        color: base0A
    },
    {
        tag: [tags.heading5, tags.heading6],
        color: base0A
    },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: base0C },
    {
        tag: [tags.processingInstruction, tags.inserted],
        color: base07
    },
    {
        tag: [tags.contentSeparator],
        color: base0D
    },
    { tag: tags.invalid, color: base02, borderBottom: `1px dotted ${invalid}` }
]);


const heynoteDark = [
    darkTheme,
    syntaxHighlighting(darkHighlightStyle)
];

export { heynoteDark, darkHighlightStyle, darkTheme };

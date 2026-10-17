export type ThemeMode = "light" | "dark"

export interface UiColors {
    accent: string
    accentSelected: string
    accentSelectedHover: string
    focus: string
    bufferTreeSelected: string
    bodyBackground: string
    bodyText: string
    editorBackground: string
    editorText: string
    blockEven: string
    blockOdd: string
    blockBorder: string
    statusBackground: string
    statusText: string
    highlight: string
    panelBackground: string
    tabBarBorder: string
    tabActive: string
    tabActiveBlurred: string
    windowBorder: string
    drawHandle: string
    mathBackground: string
    mathText: string
    mathCopiedText: string
    mathShadow: string
    cursor: string
    selection: string
    selectionBlur: string
    gutterBackground: string
    gutterText: string
    gutterBorder: string
    activeGutterText: string
    activeLine: string
    foldText: string
    searchMatch: string
    searchMatchSelected: string
    searchMatchOutline: string
    selectionMatch: string
    bracketMatch: string
    bracketMismatch: string
    bracketOutline: string
    bracketMismatchOutline: string
    searchPanelBackground: string
    searchPanelText: string
    inputBackground: string
    inputBorder: string
    inputText: string
    buttonBackground: string
    buttonHover: string
    buttonText: string
    closeIconText: string
    tooltipBackground: string
    autocompleteSelectedBackground: string
    autocompleteSelectedText: string
    taskMarker: string
    whitespace: string
}

export interface SyntaxColors {
    strikethrough: string
    keyword: string
    name: string
    deleted: string
    character: string
    property: string
    macro: string
    variable: string
    function: string
    functionDefinition: string
    label: string
    color: string
    constant: string
    standard: string
    definition: string
    separator: string
    brace: string
    annotation: string
    number: string
    changed: string
    modifier: string
    self: string
    namespace: string
    type: string
    class: string
    operator: string
    operatorKeyword: string
    tag: string
    squareBracket: string
    angleBracket: string
    attribute: string
    regexp: string
    quote: string
    string: string
    link: string
    url: string
    escape: string
    specialString: string
    meta: string
    monospace: string
    comment: string
    strong: string
    emphasis: string
    heading: string
    specialHeading1: string
    heading1: string
    heading2: string
    heading3: string
    heading4: string
    heading5: string
    heading6: string
    atom: string
    bool: string
    specialVariable: string
    processingInstruction: string
    inserted: string
    contentSeparator: string
    invalid: string
    literal: string
    definitionVariable: string
    localVariable: string
    definitionProperty: string
    invalidUnderline: string
}

export interface ThemePalette {
    ui: UiColors
    syntax: SyntaxColors
}

export interface ThemeOverrides {
    ui?: Partial<UiColors>
    syntax?: Partial<SyntaxColors>
}

export interface ColorScheme {
    id: string
    label: string
    shared?: ThemeOverrides
    light?: ThemeOverrides
    dark?: ThemeOverrides
}

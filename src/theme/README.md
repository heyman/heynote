# Color themes

Edit `defaults.js` for shared light/dark palettes or `schemes/*.js` for individual
themes. `types.ts` defines the `ui` and `syntax` color roles.

Each role resolves in this order: mode defaults → `shared` overrides → light/dark mode
specific overrides. Omitted roles inherit the previous value.

```js
shared: {
    syntax: { keyword: "#123456" },
},
light: {
    ui: { blockOdd: "#fff0f0" },
},
dark: {
    syntax: { keyword: "#abcdef" },
},
```

`resolve.js` maps roles to CSS variables (`ui.blockOdd` → `--ui-block-odd`);
`apply.js` updates them when the active note or appearance changes. Syntax tags
and text decorations are mapped in `../editor/theme/syntax.js`.

Notes store the scheme ID in their `color` metadata. Missing or unknown IDs,
including the old `grey` spelling, resolve to Gray (`gray`).

Syntax palettes are adapted for the tinted block backgrounds:

| Theme | Light / dark reference |
| --- | --- |
| Gray | [Atom One Light](https://github.com/atom/one-light-syntax) / [One Dark](https://github.com/atom/one-dark-syntax) |
| Red | [GitHub Light Default / Dark Default](https://github.com/primer/github-vscode-theme) |
| Orange | [Gruvbox Material Light / Dark](https://github.com/sainnhe/gruvbox-material) |
| Green | [Everforest Light / Dark](https://github.com/sainnhe/everforest) |
| Blue | [Kanagawa Lotus / Wave](https://github.com/rebelot/kanagawa.nvim) |
| Purple | [Catppuccin Latte / Mocha](https://github.com/catppuccin/nvim) |
| Pink | [Rosé Pine Dawn / Moon](https://github.com/rose-pine/neovim) |

`tests/main/theme.test.js` checks inheritance and syntax contrast of at least
4.5:1 against both block backgrounds and the active-line overlay.

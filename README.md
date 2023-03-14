# Heynote

Heynote is a dedicated scratchpad for developers. It functions as a large persistent text buffer where you can write down anything you like. Works great for that Slack message you don't want to accidentally send, a JSON response from an API you're working with, notes from a meeting, your daily to-do list, etc. The Heynote buffer is divided into blocks, and each block can have its own Language set (e.g. JavaScript, JSON, Markdown, etc.). This gives you syntax highlighting and lets you auto-format that JSON response.

## Features

-   Persistent text buffer
-   Block-based
-   Syntax highlighting
    -   C++
    -   CSS
    -   HTML
    -   Java
    -   JavaScript
    -   JSON
    -   Markdown
    -   PHP
    -   Python
    -   Rust
    -   SQL
    -   XML
-   Language auto-detection
-   Auto-formatting
-   Math/Calculator mode


## Installation

Download the appropriate (ARM Mac, Intel Mac, or Windows) version from the latest Github release. The Windows build is not signed, so you might have to approve some warning (I could not justify paying a yearly fee for a certificate just to get rid of that).

## Development

To develop Heynote, you should (hopefully) just need to check out the code and then run:

```
> npm install
> npm run dev
```

### Contributions

I'm happy to merge contributions that fit my vision for the app. Bug fixes are always welcome. By submitting a pull-request you assign me unrestricted republishing rights for the contribution.

Heynote is built upon [CodeMirror](https://codemirror.net/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/) and other great open-source projects.


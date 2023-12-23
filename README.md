# Heynote

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/heyman/heynote)](https://github.com/heyman/heynote/releases)


Heynote is a dedicated scratchpad for developers. It functions as a large persistent text buffer where you can write down anything you like. Works great for that Slack message you don't want to accidentally send, a JSON response from an API you're working with, notes from a meeting, your daily to-do list, etc. 

The Heynote buffer is divided into blocks, and each block can have its own Language set (e.g. JavaScript, JSON, Markdown, etc.). This gives you syntax highlighting and lets you auto-format that JSON response.

Available for Mac, Windows, and Linux.

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
-   Currency conversion
-   Multi-cursor editing
-   Dark & Light themes
-   Option to set a global hotkey to show/hide the app
-   Default or Emacs-like key bindings


## Installation

Download the appropriate (Mac, Windows or Linux) version from the latest Github release (or from [heynote.com](https://heynote.com)). The Windows build is not signed, so you might see some scary warning (I can not justify paying a yearly fee for a certificate just to get rid of that).

### Notes on Linux installation

It's been reported (#48) that ChromeOS's Debian VM need the following packages installed to run the Heynote AppImage:

```
libfuse2
libnss3
libnspr4
```

## Development

To develop Heynote you need Node.js and you should (hopefully) just need to check out the code and then run:

```
> npm install
> npm run dev
```

### Contributions

I'm happy to merge contributions that fit my vision for the app. Bug fixes are always welcome. 

## FAQ

### Where is the buffer data stored?

The default paths for the buffer data for the respective OS are:

-   Mac: `~/Library/Application Support/Heynote/buffer.txt`
-   Windows: `%APPDATA%\Heynote\buffer.txt`
-   Linux: `~/.config/Heynote/buffer.txt`

From version >=1.5.0, symlinks will be supported and you'll be able to configure the path where `buffer.txt` is stored.

### Can you make a mobile app?

No, at the moment this is out of scope, sorry.

## Thanks!

Heynote is built upon [CodeMirror](https://codemirror.net/), [Vue](https://vuejs.org/), [Electron](https://www.electronjs.org/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/) and other great open-source projects.


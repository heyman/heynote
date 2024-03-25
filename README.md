# Heynote

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/heyman/heynote)](https://github.com/heyman/heynote/releases)
[![Build Status](https://github.com/heyman/heynote/workflows/Tests/badge.svg)](https://github.com/heyman/heynote/actions?query=workflow%3ATests)

<img src="https://heynote.com/img/logo.png" style="width:79px;">

**Website:** [heynote.com](https://heynote.com)

Heynote is a dedicated scratchpad for developers. It functions as a large persistent text buffer where you can write down anything you like. Works great for that Slack message you don't want to accidentally send, a JSON response from an API you're working with, notes from a meeting, your daily to-do list, etc. 

The Heynote buffer is divided into blocks, and each block can have its own Language set (e.g. JavaScript, JSON, Markdown, etc.). This gives you syntax highlighting and lets you auto-format that JSON response.

Available for Mac, Windows, and Linux.

## Features

-   Persistent text buffer
-   Block-based
-   Syntax highlighting:

    C++, C#, Clojure, CSS, Erlang, Go, Groovy, HTML, Java, JavaScript, JSX, Kotlin, TypeScript, TOML, TSX, JSON, Lezer, Markdown, PHP, Python, Ruby, Rust, Shell, SQL, Swift, XML, YAML
    
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

It's been reported [(#48)](https://github.com/heyman/heynote/issues/48) that ChromeOS's Debian VM need the following packages installed to run the Heynote AppImage:

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

### Run Tests

To run the tests:

```
> npm run test
```

To run the tests in the Playwright UI:

```
> npm run test:ui
```


### Contributions

I'm happy to merge contributions that fit my vision for the app. Bug fixes are always welcome. 

## Math Blocks

Heynote's Math blocks are powered by [Math.js expressions](https://mathjs.org/docs/expressions). Checkout their [documentation](https://mathjs.org/docs/) to see what [syntax](https://mathjs.org/docs/expressions/syntax.html), [functions](https://mathjs.org/docs/reference/functions.html), and [constants](https://mathjs.org/docs/reference/constants.html) are available.

### Accessing the previous result

The variable `prev` can be used to access the previous result. For example:

```
128
prev * 2 # 256
```

### Changing how the results of Math blocks are formatted?

You can define a custom `format` function within the Math block like this:

```
_format = format # store reference to the built in format
format(x) = _format(x, {notation:"exponential"})
```

See the [Math.js format()](https://mathjs.org/docs/reference/functions/format.html) function for more info on what's supported.


## FAQ

### Where is the buffer data stored?

The default paths for the buffer data for the respective OS are:

-   Mac: `~/Library/Application Support/Heynote/buffer.txt`
-   Windows: `%APPDATA%\Heynote\buffer.txt`
-   Linux: `~/.config/Heynote/buffer.txt`

From version >=1.5.0, symlinks will be supported and you'll be able to configure the path where `buffer.txt` is stored.

### Can you make a mobile app?

No, at the moment this is out of scope, sorry.

### Can you add a feature for naming blocks and/or adding tags? [(#44)](https://github.com/heyman/heynote/issues/44)

Currently, I'm not planning on adding this. The main reason is that it goes against the scratchpadness of the program.

I can totally see the usefulness of such a feature, and it's definitely something that I would expect from a more traditional Notes app. However a large part of Heynote's appeal is it's simplicity, and if that is to remain so, I'm going to have to say no to a lot of actually useful features.

### What are the default keyboard shortcuts?

**On Mac**

```
⌘ + Enter           Add new block below the current block
⌥ + Enter           Add new block before the current block
⌘ + Shift + Enter   Add new block at the end of the buffer
⌥ + Shift + Enter   Add new block at the start of the buffer
⌘ + ⌥ + Enter       Split the current block at cursor position
⌘ + L               Change block language
⌘ + Down            Goto next block
⌘ + Up              Goto previous block
⌘ + A               Select all text in a note block. Press again to select the whole buffer
⌘ + ⌥ + Up/Down     Add additional cursor above/below
⌥ + Shift + F       Format block content (works for JSON, JavaScript, HTML, CSS and Markdown)
```

**On Windows and Linux**

```
Ctrl + Enter           Add new block below the current block
Alt + Enter            Add new block before the current block
Ctrl + Shift + Enter   Add new block at the end of the buffer
Alt + Shift + Enter    Add new block at the start of the buffer
Ctrl + Alt + Enter     Split the current block at cursor position
Ctrl + L               Change block language
Ctrl + Down            Goto next block
Ctrl + Up              Goto previous block
Ctrl + A               Select all text in a note block. Press again to select the whole buffer
Ctrl + Alt + Up/Down   Add additional cursor above/below
Alt + Shift + F        Format block content (works for JSON, JavaScript, HTML, CSS and Markdown)
Alt                    Show menu
```

## Thanks!

Heynote is built upon [CodeMirror](https://codemirror.net/), [Vue](https://vuejs.org/), [Electron](https://www.electronjs.org/), [Math.js](https://mathjs.org/), [Prettier](https://prettier.io/) and other great open-source projects.


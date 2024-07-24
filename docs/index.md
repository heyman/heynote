# Heynote Documentation

Heynote is a dedicated scratchpad for developers. It functions as a large persistent text buffer where you can write down anything you like. Works great for that Slack message you don't want to accidentally send, a JSON response from an API you're working with, notes from a meeting, your daily to-do list, etc.

The Heynote buffer is divided into blocks, and each block can have its own Language set (e.g. JavaScript, JSON, Markdown, etc.). This gives you syntax highlighting and lets you auto-format that JSON response.

Available for Mac, Windows, and Linux.

## Features

-   Persistent text buffer
-   Block-based
-   Syntax highlighting:

    C++, C#, Clojure, CSS, Erlang, Dart, Go, Groovy, HTML, Java, JavaScript, JSX, Kotlin, TypeScript, TOML, TSX, JSON, Lezer, Markdown, PHP, Python, Ruby, Rust, Shell, SQL, Swift, Vue, XML, YAML

-   Language auto-detection
-   Auto-formatting
-   Math/Calculator mode
-   Currency conversion
-   Multi-cursor editing
-   Dark & Light themes
-   Option to set a global hotkey to show/hide the app
-   Default or Emacs-like key bindings

## Default Key Bindings

<!-- keyboard_shortcuts -->

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

## Download/Installation

Download the appropriate (Mac, Windows or Linux) version from [heynote.com](https://heynote.com). The Windows build is not signed, so you might see some scary warning (I can not justify paying a yearly fee for a certificate just to get rid of that).

If installing Heynote on Linux in ChromeOS, see the [notes](#linux-on-chromeos) below about some packages that are needed.

## Math Blocks

Heynote's Math blocks are powered by [Math.js expressions](https://mathjs.org/docs/expressions). Checkout their [documentation](https://mathjs.org/docs/) to see what [syntax](https://mathjs.org/docs/expressions/syntax.html), [functions](https://mathjs.org/docs/reference/functions.html), and [constants](https://mathjs.org/docs/reference/constants.html) are available.

### Accessing the previous result

The variable `prev` can be used to access the previous result. For example:

```
128
prev * 2 # 256
```

### Changing how the results of Math blocks are formatted

You can define a custom `format` function within the Math block like this:

```
_format = format # store reference to the built in format
format(x) = _format(x, {notation:"exponential"})
```

You can also do something like this to show the number with your default locale or provide a [custom one](https://www.w3.org/International/articles/language-tags/):

```
format(x) = x.toLocaleString();
format(x) = x.toLocaleString('en-GB');
```


See the [Math.js format()](https://mathjs.org/docs/reference/functions/format.html) function for more info on what's supported.

## The buffer file

The default paths for the buffer data for the respective operating systems are:

-   Mac: `~/Library/Application Support/Heynote/buffer.txt`
-   Windows: `%APPDATA%\Heynote\buffer.txt`
-   Linux: `~/.config/Heynote/buffer.txt`

## Linux

### Linux on ChromeOS

It's been reported [(#48)](https://github.com/heyman/heynote/issues/48) that ChromeOS's Debian VM need the following packages installed to run the Heynote AppImage:

```
libfuse2
libnss3
libnspr4
```

#### Wayland

Due to [an issue in Electron](https://github.com/electron/electron/issues/38288), the global hotkey will not work in all applications running under Wayland. In KDE it is possible to work around this limitation by adding this Kwin script:

```javascript
function toggleHeynote() {
  var client = workspace.clientList().find((c) => c.resourceClass.toLowerCase() === 'heynote');
  if (client) {
    if (client.minimized) {
      client.minimized = false;
      workspace.activeClient = client;
    } else {
      if (workspace.activeClient == client) {
        client.minimized = true;
      } else {
        workspace.activeClient = client;
      }
    }
  }
}
registerShortcut('toggleHeynote', 'Toggle Heynote', 'Ctrl+Shift+H', toggleHeynote);
```

See the [KWin scripting tutorial](https://develop.kde.org/docs/plasma/kwin/) for instructions on how to install the script.

Remember to enable the script in the KDE System Settings. It may also be necessary to go into the KDE System Settings and bind the "Toggle Heynote" key manually.

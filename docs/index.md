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
⌘ + S               Create a new note from the current block
⌘ + P               Open note selector
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
Ctrl + S               Create a new note from the current block
Ctrl + P               Open note selector
Ctrl + Down            Goto next block
Ctrl + Up              Goto previous block
Ctrl + A               Select all text in a note block. Press again to select the whole buffer
Ctrl + Alt + Up/Down   Add additional cursor above/below
Alt + Shift + F        Format block content (works for JSON, JavaScript, HTML, CSS and Markdown)
Alt                    Show menu
```

## Download/Installation

Download the appropriate (Mac, Windows or Linux) version from [heynote.com](https://heynote.com). The Windows build is not signed, so you might see some scary warning (I can not justify paying a yearly fee for a certificate just to get rid of that).

If installing Heynote on Linux in ChromeOS, see the [notes](#user-content-linux-on-chromeos) below about some packages that are needed.

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


## Changelog

Here are the most notable changes in each release. For a more detailed list of changes, see the [Github Releases page](https://github.com/heyman/heynote/releases).

### 2.0.0-beta (not yet released)

#### Support for multiple note buffers. 

Apart from the default scratch buffer, you can now create and switch between multiple note buffers. By pressing `Ctrl/Cmd+S` you can create a new note from the current block (the current block will be moved into the new note). New note buffers are saved to the note library which is basically a directories (with sub dirs) on the disk with `.txt` files. You switch between note buffers by pressing `Ctrl/Cmd+P`.

The first time you start the new version of Heynote, your existing buffer file will be migrated to the new note library. If you're using the default buffer location, that means that the existing scratch buffer file will be moved from `%APP_DIR%/buffer.txt` to `%APP_DIR%/notes/scratch.txt`. If you are using a custom buffer location the file will be moved from `%CUSTOM_DIR%/buffer.txt` to `%CUSTOM_DIR%/scratch.txt`.

#### Other changes

- The file format for the buffer files has been updated to include some JSON metadata at the top of the file. 
- The cursor(s) location is saved between sessions.
- The setting for changing the color theme is now located in the program settings, instead of in the status bar.

### 1.8.0

- Performance optimizations
- Add default redo cmd that works on all Platforms. Mod+Shift+Z
- Fix bug causing editing to break for empty blocks in some cases
- Add setting for configuring the default block language
- Vue language support
- Dart Syntax
- Fix error on startup for large buffers

### 1.7.1

- Update to latest version of Electron. Fixes crash on MacOS 15 Developer Preview

### 1.7.0

- Fix "white flash" effect when resizing window in dark mode
- Add prev variable to Math blocks that holds the previous value
- Add settings button to status bar
- Add version number to settings dialog
- Persist window location when opening the app
- Copy whole current line(s) when selection(s) are empty
- Fix block corruption when deleting block content using deleteLine command
- Add PowerShell and Diff language modes
- "Always on top" setting which makes Heynote stay on top of other programs

### 1.6.0

- Added support for having Heynote in the Mac Menu Bar / Tray icon
- Ability to specify file system location of Heynote's buffer file. The buffer will automatically be reloaded if changed on disk, so this should make it possible to have the buffer automatically synced between machines using a file-syncing service such as Dropbox.
- Custom font and font size support.
- More key-binding for creating new blocks
- Syntax hightlighting support for new languages:
  * Swift
  * Kotlin
  * Groovy
- Auto-close brackets functionality that can be turned on in settings
- Ability to change how calculations are formatted in Math blocks. See the [Docs](https://heynote.com/docs/#user-content-changing-how-the-results-of-math-blocks-are-formatted) for info on how to do this.
- There's now a Heynote webapp at [app.heynote.com](https://app.heynote.com). It's still work-in-progress, but should be usable. The buffer is stored in localStorage.
- Multiple bug fixes and minor improvement.


### 1.5.0

- Add support for the following languages
  * TypeScript
  * JSX
  * TSX
  * TOML
  * C#
  * Clojure
  * Erlang
  * Golang
  * Lezer
  * Ruby
  * Shell
  * YAML
- Various bug fixes and improvements

### 1.4.1

- Fixed issue that would sometimes cause auto formatting to freeze the app for long periods.

### 1.4.0

- Added ability to set a global hotkey for showing/hiding Heynote.

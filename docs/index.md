# Heynote Documentation

[Changelog](/docs/changelog/)

Heynote is a dedicated scratchpad. It functions as a large persistent text buffer where you can write down anything you like. Works great for that Slack message you don't want to accidentally send, a JSON response from an API you're working with, notes from a meeting, your daily to-do list, etc. 

The Heynote buffer is divided into blocks, and each block can have its own mode set (e.g. JavaScript, JSON, Markdown, etc.). This gives you syntax highlighting and lets you auto-format that JSON response.

Available for Mac, Windows, and Linux.

## Features

-   Persistent text buffer(s)
-   Block-based
-   Inline images
-   Multiple buffers in tabs
-   Math/Calculator mode
-   Currency conversion
-   Syntax highlighting:

    C++, C#, Clojure, CSS, Elixir, Erlang, Dart, Go, Groovy, HTML, Java, JavaScript, JSX, Kotlin, TypeScript, TOML, TSX, JSON, Lezer, Markdown, PHP, Python, Ruby, Rust, Scala, Shell, SQL, Swift, Vue, XML, YAML
    
-   Language auto-detection
-   Auto-formatting
-   Multi-cursor editing
-   Dark & Light themes
-   Option to set a global hotkey to show/hide the app
-   Default, Emacs-like or custom key bindings
-   Spellchecking


## Default Key Bindings<a id="default-key-bindings"></a>

<!-- keyboard_shortcuts -->

**On Mac**

```
⌘ + Enter           在当前块下方添加新块
⌥ + Enter           在当前块上方添加新块
⌘ + Shift + Enter   在缓冲区末尾添加新块
⌥ + Shift + Enter   在缓冲区开头添加新块
⌘ + ⌥ + Enter       在光标位置拆分当前块
⌘ + L               更改块语言
⌘ + N               创建新的笔记缓冲区
⌘ + S               将当前块移动到另一个（或新的）缓冲区
⌘ + P               打开笔记选择器
⌘ + Shift + P       打开命令面板
⌘ + Down            转到下一个块
⌘ + Up              转到上一个块
⌘ + A               选择笔记块中的所有文本。再次按选择整个缓冲区
⌘ + ⌥ + Up/Down     在上方/下方添加额外光标
⌥ + Shift + F       格式化块内容（适用于 JSON、JavaScript、HTML、CSS 和 Markdown）
⌘ + ⌥ + [           折叠块
⌘ + ⌥ + ]           展开块
⌘ + ⌥ + .           切换块折叠状态
```

**On Windows and Linux**

```
Ctrl + Enter           在当前块下方添加新块
Alt + Enter            在当前块上方添加新块
Ctrl + Shift + Enter   在缓冲区末尾添加新块
Alt + Shift + Enter    在缓冲区开头添加新块
Ctrl + Alt + Enter     在光标位置拆分当前块
Ctrl + L               更改块语言
Ctrl + N               创建新的笔记缓冲区
Ctrl + S               将当前块移动到另一个（或新的）缓冲区
Ctrl + P               打开笔记选择器
Ctrl + Shift + P       打开命令面板
Ctrl + Down            转到下一个块
Ctrl + Up              转到上一个块
Ctrl + A               选择笔记块中的所有文本。再次按选择整个缓冲区
Ctrl + Alt + Up/Down   在上方/下方添加额外光标
Alt + Shift + F        格式化块内容（适用于 JSON、JavaScript、HTML、CSS 和 Markdown）
Ctrl + Alt + [         折叠块
Ctrl + Alt + ]         展开块
Ctrl + Alt + .         切换块折叠状态
```

You can see all the key bindings in the command palette and in Settings under Key Bindings.





## Custom Key Bindings<a id="custom-key-bindings"></a>

Heynote supports custom key bindings which you can configure in the settings. The key bindings are evaluated from top to bottom, so a binding that comes before another one will take precedence. Most commands will stop the event from propagating, but some commands only applies in certain contexts and might not stop the event from propagating to a later key binding. 

To disable one of the built in key bindings, you can add a new key binding with the same key combination for the command "Do nothing". This will stop the event from propagating to the built in key binding.

You can see all available commands that can be bound to keys in the command palette which can be opened by pressing `⌘ + ⇧ + P` on Mac and `Ctrl + ⇧ + P` on Windows/Linux.

## Download/Installation

Download the appropriate (Mac, Windows or Linux) version from [heynote.com](https://heynote.com). The Windows build is not signed, so you might see some scary warning (I can not justify paying a yearly fee for a certificate just to get rid of that).

If installing Heynote on Linux in ChromeOS, see the [notes](#user-content-linux-on-chromeos) below about some packages that are needed.

On macOS, [Homebrew](https://brew.sh) users can utilize an unofficial [Homebrew Cask](https://formulae.brew.sh/cask/heynote#default): `brew install --cask heynote`

## Math Blocks<a id="math-blocks"></a>

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

## Images

Pasting image data from the clipboard will insert an inline image into the buffer. Internally, the image data is saved to a file 
within [the notes library's](#user-content-the-notes-library) `.images` directory. Drag and dropping an image file will also insert the image 
into the editor (a copy of the image will be placed in the `.images` directory).

Images can be resized for display, but the underlying image data keeps its original dimensions. Issuing a copy command (`Ctrl/Cmd-C` with the 
default key bindings) with the cursor next to an image will populate the system clipboard with the image data.


## The notes library<a id="the-notes-library"></a>

The notes library is a directory (with sub dirs) on the disk with a `.txt` file for each buffer. It's created the first time you start Heynote, with the default buffer file `scratch.txt` in it. The default location for the library is:

-   Mac: `~/Library/Application Support/Heynote/notes/`
-   Windows: `%APPDATA%\Heynote\notes\`
-   Linux: `~/.config/Heynote/notes/`

You can change the path of the notes library in the settings. Heynote expects reasonably fast disk access to the notes library, so it's not recommended to use a network drive, though file syncing services like Dropbox, OneDrive, etc. should work (see below).

### Image storage

Images are stored alongside your notes in a hidden `.images` folder inside the notes library directory. Each image is referenced from the buffer file, and the app uses those references to clean up older, unreferenced images over time. Cleanup runs on startup and only removes unreferenced images older than 24 hours (and only if there are any referenced images, as a safety check).

### Synchronizing the notes library

Heynote is built to support synchronizing the notes library (or buffer file in the case of Heynote 1.x) through file-syncing services like Dropbox, OneDrive, etc. However, note that the synchronization logic is quite simple, so editing the same buffer on two different machines at the same time might lead to conflicts and unexpected results.

When using a file synching service that support "offloading" of files in the cloud (removing them from the disk), it's recommended to mark the notes library as "always available offline".

As always, backup things that are important.


## Spellchecking

Spellchecking can be toggled on or off by clicking the spellchecking icon in the status bar. Right-clicking the icon on Windows and Linux allows you to select the active dictionaries (on Mac, the default OS dictionary is used).  


## Linux<a id="linux"></a>

### Linux on ChromeOS<a id="linux-on-chromeos"></a>

It's been reported [(#48)](https://github.com/heyman/heynote/issues/48) that ChromeOS's Debian VM need the following packages installed to run the Heynote AppImage:

```
libfuse2
libnss3
libnspr4
```

### Wayland

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

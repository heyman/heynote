# Changelog

Here are the most notable changes in each release. For a more detailed list of changes, see the [Github Releases page](https://github.com/heyman/heynote/releases).

## 2.3.0-beta.2

### Improved support for folding blocks

- Fixed an issue where some types of blocks could not be folded. 
- The fold state is now stored in the buffer file so that it's persisted between sessions. 
- Added three new commands for folding and unfolding blocks:
  - `foldBlock` - Folds the current/selected block(s). Default key binding is `Ctrl-Alt-[` on Windows/Linux and `Cmd-Option-[` on Mac.
  - `unfoldBlock` - Unfolds the current/selected block(s). Default key binding is `Ctrl-Alt-]` on Windows/Linux and `Cmd-Option-]` on Mac.
  - `toggleFoldBlock` - Toggles the fold state of the current/selected block. Default key binding is `Ctrl-Alt-.` on Windows/Linux and `Cmd-Option-.` on Mac.
- Folded blocks now display the first 50 characters of the block content, as well as the number of lines in the block.
- Default key bindings for folding code on Mac changed from `Cmd-Option-[` and `Cmd-Option-]` to `Cmd-Shift-[` and `Cmd-Shift-]` (to avoid conflicts with the new block folding commands)

### Other features and fixes

- Add document navigation commands (Ctrl+Home/End)
- Fix wrong positioning if IME interface (for Chinese input)
- Prevent editor from loosing focus when line number/fold gutter is clicked

## 2.2.2

- Fix issue when changing settings after having upgraded to Heynote 2.2 from an earlier version

## 2.2.1

### Bug Fixes

- Fix issue where the second command in the command palette, instead of the first command, was selected when the palette is opened.
- Change name/label of some commands in the command palette, and make commands searchable using their key names as well.
- Fix key bindings for toggleComment and toggleBlockComment commands that were previously working.
- Fix issue with lists in markdown blocks not automatically being continued when pressing enter.


## 2.2.0

### New Features

- Added support for custom key bindings. See [the documentation](https://heynote.com/docs/#user-content-custom-key-bindings) for more info.
- Added a "command palette" that can be accessed by pressing `Ctrl/Cmd+Shift+P`, or just typing `>` in the buffer selector. The command palette allows you to discover all available commands in the app, and to quickly execute them.
- Added support for configuring the tab size, as well as the option to use tabs instead of spaces for indentation.
- Added functionality for moving blocks up and down. Default key bindings are `Ctrl/Cmd+Alt+Shift+Up` and `Ctrl/Cmd+Alt+Shift+Down`.
- Added functionality for inserting the current date and time. Default key binding is `Alt+Shift+D`.

### Other changes

- Upgraded to latest version of Electron, CodeMirror, Vue, electron-builder and other dependencies.

## 2.1.4

- Fix issue with positioning and size of todo list checkboxes in Markdown blocks when using a non-default font size, or a non-monospaced font.
- Fix issue when pressing `Ctrl/Cmd+A` in a text input inside a modal dialog (e.g. the buffer selector). Previously the select all command would be sent to the editor.

## 2.1.3

- Fix escaping issue in buffer selector (properly this time, hopefully)

## 2.1.2 (yanked)

- Fix issue where buffer name wasn't properly escaped in buffer selector

## 2.1.1

- Fix bug on Windows causing sub directories in the note library to not work correctly

## 2.1.0

### New Features

- Added support for moving the current block to another (or new) buffer. Pressing `Ctrl/Cmd+S` will now pop up a dialog where you can search for and select another buffer to which the block will be moved. It's also possible to select to create a new buffer to which the block will be moved.
- Add right click context menu with undo/redo/cut/copy/paste/select all as well as Delete Block and Move block to another buffer.
- Add File menu item for switching buffer
- When deleting a block, the cursor will now end up at the beginning of the next block, instead of at the end of the previous block.
- Added support for the following languages:
  * Elixir
  * Scala
- PHP blocks no longer requires `<?php` for syntax highlighting to work

### Bug Fixes

- MacOS: Clicking the Heynote icon in the dock when using menu bar mode didn't bring up the window
- Redo from the application menu didn't work


## 2.0.0

### IMPORTANT (breaking change)

The default path of the scratch file has changed. The first time you start the new version of Heynote, your existing buffer file will be migrated to the new note library. If you're using the default buffer location, that means that the existing Scratch buffer file will be moved from `%APP_DIR%/buffer.txt` to `%APP_DIR%/notes/scratch.txt`. If you are using a custom buffer location the existing scratch file will be moved from `%CUSTOM_DIR%/buffer.txt` to `%CUSTOM_DIR%/scratch.txt`. Before the migration, the existing buffer file will be backed up to `%APP_DIR%/buffer.txt.bak` or `%CUSTOM_DIR%/buffer.txt.bak`.

If you are running a previous version of Heynote with the buffer file synchronized across multiple machines using a file synching service such as Dropbox or OneDrive, you should make sure to upgrade all machines to Heynote 2.0 at the same time (closing Heynote before) in order for the file to stay in sync, since the file path for the buffer file has changed. 

### Support for multiple note buffers. 

Apart from the default Scratch buffer, you can now create and switch between multiple note buffers. `Ctrl/Cmd+N` opens up a dialog for creating a new buffer. By pressing `Ctrl/Cmd+S` you can create a new note from the current block (the current block will be moved into the new note). New note buffers are saved to the note library which is basically a directory (with sub dirs) on the disk with a `.txt` file for each buffer. You switch between buffers by pressing `Ctrl/Cmd+P`.

### Other changes

- The file format for the buffer files has been updated to include some JSON metadata at the top of the file. 
- The cursor(s) location is saved between sessions.
- Improvements when using a file syncing service (e.g. Dropbox, OneDrive) to sync the note library between machines.
- The setting for changing the color theme is now located in the program settings, instead of in the status bar.
- Improvements to the language selector's search feature (it's now possible to search for languages by their file extension).

## 1.8.0

- Performance optimizations
- Add default redo cmd that works on all Platforms. Mod+Shift+Z
- Fix bug causing editing to break for empty blocks in some cases
- Add setting for configuring the default block language
- Vue language support
- Dart Syntax
- Fix error on startup for large buffers

## 1.7.1

- Update to latest version of Electron. Fixes crash on MacOS 15 Developer Preview

## 1.7.0

- Fix "white flash" effect when resizing window in dark mode
- Add prev variable to Math blocks that holds the previous value
- Add settings button to status bar
- Add version number to settings dialog
- Persist window location when opening the app
- Copy whole current line(s) when selection(s) are empty
- Fix block corruption when deleting block content using deleteLine command
- Add PowerShell and Diff language modes
- "Always on top" setting which makes Heynote stay on top of other programs

## 1.6.0

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


## 1.5.0

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

## 1.4.1

- Fixed issue that would sometimes cause auto formatting to freeze the app for long periods.

## 1.4.0

- Added ability to set a global hotkey for showing/hiding Heynote.

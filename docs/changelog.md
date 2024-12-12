# Changelog

Here are the most notable changes in each release. For a more detailed list of changes, see the [Github Releases page](https://github.com/heyman/heynote/releases).

## 2.0.0-beta

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

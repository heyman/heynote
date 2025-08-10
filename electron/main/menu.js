const { app, Menu } = require("electron")
import { OPEN_SETTINGS_EVENT, UNDO_EVENT, REDO_EVENT, MOVE_BLOCK_EVENT, DELETE_BLOCK_EVENT, CHANGE_BUFFER_EVENT, SELECT_ALL_EVENT, SCRATCH_FILE_NAME } from '@/src/common/constants'
import { openAboutWindow } from "./about";
import { quit } from "./index"

import { getLanguageName } from "@/src/common/language-code/language-code"

const isMac = process.platform === "darwin"


const undoMenuItem = {
    label: 'Undo',
    accelerator: 'CommandOrControl+z',
    click: (menuItem, window, event) => {
        window?.webContents.send(UNDO_EVENT)
    },
}

const redoMenuItem = {
    label: 'Redo',
    accelerator: 'CommandOrControl+Shift+z',
    click: (menuItem, window, event) => {
        window?.webContents.send(REDO_EVENT)
    },
}

const selectAllMenuItem = {
    label: 'Select All',
    accelerator: 'CommandOrControl+a',
    click: (menuItem, window, event) => {
        window?.webContents.send(SELECT_ALL_EVENT)
    },
}

const deleteBlockMenuItem = {
    label: 'Delete block',
    accelerator: 'CommandOrControl+Shift+D',
    click: (menuItem, window, event) => {
        window?.webContents.send(DELETE_BLOCK_EVENT)
    },
}

const moveBlockMenuItem = {
    label: 'Move block to another buffer…',
    accelerator: 'CommandOrControl+S',
    click: (menuItem, window, event) => {
        window?.webContents.send(MOVE_BLOCK_EVENT)
    },
}

const changeBufferMenuItem = {
    label: 'Switch buffer…',
    accelerator: 'CommandOrControl+P',
    click: (menuItem, window, event) => {
        window?.webContents.send(CHANGE_BUFFER_EVENT)
    },
}

const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About', 
                click: (menuItem, window, event) => {
                    // open about window
                    openAboutWindow()
                },
            },
            { type: 'separator' },
            changeBufferMenuItem,
            {
                label: 'Settings',
                click: (menuItem, window, event) => {
                    window?.webContents.send(OPEN_SETTINGS_EVENT)
                },
                accelerator: isMac ? 'Command+,': null,
            },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : [{
        role: 'fileMenu',
        submenu: [
            changeBufferMenuItem,
            {
                label: 'Settings',
                click: (menuItem, window, event) => {
                    window?.webContents.send(OPEN_SETTINGS_EVENT)
                },
            },
            {
                label: 'About', 
                click: (menuItem, window, event) => {
                    // open about window
                    openAboutWindow()
                },
            },
        ],
    }]),
    /*{
        label: 'File',
        submenu: [
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },*/
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            undoMenuItem,
            redoMenuItem,
            { type: 'separator' },
            deleteBlockMenuItem,
            moveBlockMenuItem,
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                selectAllMenuItem,
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startSpeaking' },
                        { role: 'stopSpeaking' }
                    ]
                }
            ] : [
                { role: 'delete' },
                { type: 'separator' },
                selectAllMenuItem,
            ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            {
                accelerator: 'CommandOrControl+=',
                role: "zoomIn",
                visible: false
            },
            {
                accelerator: 'CmdOrCtrl+Plus',
                role: "zoomIn",
                visible: true
            },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [
                { role: 'close' }
            ])
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Documentation',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://heynote.com/docs/')
                }
            },
            {
                label: 'Website',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://heynote.com')
                }
            }
        ]
    }
]

export const menu = Menu.buildFromTemplate(template)


export function getTrayMenu(win) {
    return Menu.buildFromTemplate([
        {
            label: 'Open Heynote',
            click: () => {
                win.show()
            },
        },
        { type: 'separator' },
        ...template,
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                quit()
            },
        },
    ])
}

export function getEditorContextMenu(win) {
    return Menu.buildFromTemplate([
        undoMenuItem,
        redoMenuItem,
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {type: 'separator'},
        selectAllMenuItem,
        {type: 'separator'},
        deleteBlockMenuItem,
        moveBlockMenuItem,
    ])
}

export function getTabContextMenu(win, tabPath) {
    const isScratchFile = tabPath === SCRATCH_FILE_NAME
    
    const menuItems = []
    
    if (!isScratchFile) {
        menuItems.push(
            {
                label: 'Edit Buffer',
                click: () => {
                    win?.webContents.send('tab:editBuffer', tabPath)
                },
            },
            {
                label: 'Delete Buffer',
                click: () => {
                    win?.webContents.send('tab:deleteBuffer', tabPath)
                },
            }
        )
    }

    menuItems.push(
        {
            label: 'Open Buffer…',
            click: () => {
                win?.webContents.send('tab:openNew')
            },
        },
        {
            label: 'New Buffer…',
            click: () => {
                win?.webContents.send('tab:createNew')
            },
        },
        {type: 'separator'},
        {
            label: 'Close Tab',
            click: () => {
                win?.webContents.send('tab:close', tabPath)
            },
        },
    )
    
    return Menu.buildFromTemplate(menuItems)
}


export function getSpellcheckingContextMenu(win) {
    const languages = win.webContents.session.availableSpellCheckerLanguages
    const selectedLanguages = win.webContents.session.getSpellCheckerLanguages()
    //console.log("Available spellchecker languages:", languages)
    //console.log("selected languages:", selectedLanguages)
    
    //win.webContents.session.listWordsInSpellCheckerDictionary().then((words) => {
    //    console.log("words:", words)
    //})

    const menuItems = []
    for (const lang of languages) {
        menuItems.push({
            label: getLanguageName(lang),
            type: 'checkbox',
            checked: selectedLanguages.includes(lang),
            click: () => {
                if (selectedLanguages.includes(lang)) {
                    win.webContents.setSpellCheckerLanguages(selectedLanguages.filter(l => l !== lang))
                } else {
                    win.webContents.setSpellCheckerLanguages([...selectedLanguages, lang])
                }
            },
        })
    }

    return Menu.buildFromTemplate(menuItems)
}

const { app, Menu } = require("electron")
import { OPEN_SETTINGS_EVENT } from "../constants";
import { openAboutWindow } from "./about";
import { quit } from "./index"

const isMac = process.platform === "darwin"

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
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
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
                { role: 'selectAll' }
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


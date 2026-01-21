import { test, expect } from '@playwright/test';
import { NoteFormat } from '@/src/common/note-format.js';

export function pageErrorGetter(page) {
    let messages = [];
    page.on('pageerror', (error) => {
        messages.push(`[${error.name}] ${error.message}`);
    });
    return () => messages;
}


export class HeynotePage {
    constructor(page) {
        this.page = page
        this.getErrors = pageErrorGetter(page)
        this.isMac = process.platform === "darwin"
    }

    async goto() {
        await this.page.goto("/")
        await expect(this.page).toHaveTitle(/Heynote/)
        await expect(this.page.locator(".cm-editor")).toBeVisible()
        expect(this.getErrors()).toStrictEqual([])
    }

    async getBlocks() {
        return await this.page.evaluate(() => window._heynote_editor.getBlocks())
    }

    async getBufferData() {
        return await this.page.evaluate(() => window._heynote_editor.getContent())
    }

    async getContent() {
        const note = NoteFormat.load(await this.getBufferData())
        return note.content
    }

    async setContent(content) {
        await expect(this.page.locator("css=.cm-editor")).toBeVisible()
        await this.page.evaluate(async (content) => {
            await window._heynote_editor.setContent(content)
            await window._heynote_editor.save()
        }, content)
    }

    async getCursorPosition() {
        return await this.page.evaluate(() => window._heynote_editor.getCursorPosition())
    }

    async setCursorPosition(position) {
        await this.page.evaluate((position) => window._heynote_editor.setCursorPosition(position), position)
    }

    async getMainSelection() {
        return await this.page.evaluate(() => window._heynote_editor.view.state.selection.main)
    }

    async expectSelectionContent(content) {
        return await expect.poll(async () => {
            return await this.page.evaluate(() => {
                const state = window._heynote_editor.view.state
                const selection = state.selection.main
                console.log("selection:", state.doc.sliceString(selection.from, selection.to))
                return state.doc.sliceString(selection.from, selection.to)
            })
        }).toBe(content)
    }

    async getBlockContent(blockIndex) {
        const blocks = await this.getBlocks()
        const content = await this.getContent()
        expect(blocks.length).toBeGreaterThan(blockIndex)
        const block = blocks[blockIndex]
        return content.slice(block.content.from, block.content.to)
    }

    async getStoredSettings() {
        return await this.page.evaluate(() => JSON.parse(window.localStorage.getItem("settings")))
    }

    async getStoredBufferList() {
        return await this.page.evaluate(() => window.heynote.buffer.getList())
    }

    async getStoredBuffer(path) {
        return await this.page.evaluate((path) => window.heynote.buffer.load(path), path)
    }

    async saveBuffer(path, content) {
        const format = new NoteFormat()
        format.content = content
        await this.page.evaluate(({path, content}) => window.heynote.buffer.save(path, content), {path, content:format.serialize()})
    }

    async getSettings() {
        return await this.page.evaluate(() => {
            return JSON.parse(window.localStorage.getItem("settings") || "{}")
        })
    }

    async setSettings(settings) {
        await this.page.evaluate((settings) => window.heynote.setSettings(settings), settings)
    }

    agnosticKey(key) {
        return key.replace("Mod", this.isMac ? "Meta" : "Control")
    }

    async executeCommand(command) {
        return await this.page.evaluate((command) => window._heynote_editor.executeCommand(command), command)
    }

    async waitForContentSaved() {
        await expect.poll(async () => {
            const editorContent = await this.page.evaluate(() => window._heynote_editor.getContent())
            const diskContent = await this.page.evaluate(() => window._heynote_editor.diskContent)
            return editorContent === diskContent
        }).toBeTruthy()
    }
}

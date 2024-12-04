import { test, expect } from '@playwright/test';
import { NoteFormat } from '../src/common/note-format.js';

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
        await this.page.evaluate((content) => window._heynote_editor.setContent(content), content)
    }

    async getCursorPosition() {
        return await this.page.evaluate(() => window._heynote_editor.getCursorPosition())
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

    agnosticKey(key) {
        return key.replace("Mod", this.isMac ? "Meta" : "Control")
    }
}

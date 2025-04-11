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

    agnosticKey(key) {
        return key.replace("Mod", this.isMac ? "Meta" : "Control")
    }
}

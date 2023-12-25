import { test, expect } from '@playwright/test';

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

    async getContent() {
        return await this.page.evaluate(() => window._heynote_editor.getContent())
    }
    
    async setContent(content) {
        await this.page.evaluate((content) => window._heynote_editor.setContent(content), content)
    }

    async getBlockContent(blockIndex) {
        const blocks = await this.getBlocks()
        const content = await this.getContent()
        expect(blocks.length).toBeGreaterThan(blockIndex)
        const block = blocks[blockIndex]
        return content.slice(block.content.from, block.content.to)
    }
}

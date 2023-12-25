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
}

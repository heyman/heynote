import { test, expect } from '@playwright/test';
import { HeynotePage } from './test-utils.js';


test('load heynote', async ({ page }) => {
    let heynotePage = new HeynotePage(page)
    await heynotePage.goto()

    expect((await heynotePage.getBlocks()).length).toBe(1)
    
    //expect(await page.evaluate(() => window.heynote._editor.getBlocks()).length).toBe(1)
    //console.log(tmp.getContent())
    await page.locator('body').pressSequentially('Hello World!')
    await page.locator("body").press("Enter")
    //await page.waitForTimeout(100);
    await page.locator("body").press("Meta+Enter")
    await page.waitForTimeout(500);

    expect((await heynotePage.getBlocks()).length).toBe(2)
    
    //await page.evaluate(() =>
    //await page.locator("#app").pressEnter()
})

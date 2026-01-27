import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";
import { parseImagesFromString } from "../../src/editor/image/image-parsing.js";

let heynotePage;

const buildContent = (tag) => `
∞∞∞text
hello ${tag} world`;

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page);
    await heynotePage.goto();
});

test("draw modal saves image and updates tag", async () => {
    await heynotePage.page.evaluate(() => {
        window.__saveImageCalls = [];
        if (!window.heynote?.buffer) {
            throw new Error("heynote buffer not available");
        }
        window.heynote.buffer.saveImage = async (payload) => {
            window.__saveImageCalls.push({
                mime: payload?.mime,
                size: payload?.data?.length ?? payload?.data?.byteLength ?? 0,
            });
            return "drawn-test.png";
        };
    });

    const tag = "<∞img;id=img-draw-1;file=/icon.png;w=120;h=120∞>";
    await heynotePage.setContent(buildContent(tag));

    const imageWidget = heynotePage.page.locator(".heynote-image");
    await expect(imageWidget).toBeVisible();
    await imageWidget.hover();

    const drawButton = heynotePage.page.locator(".heynote-image .buttons-container .draw");
    await expect(drawButton).toBeVisible();
    await drawButton.click();

    const modal = heynotePage.page.locator(".draw-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("canvas").first()).toBeVisible();

    await modal.locator(".bottom-bar .save").click();
    await expect(modal).toHaveCount(0);

    await expect.poll(async () => {
        return await heynotePage.page.evaluate(() => window.__saveImageCalls.length);
    }).toBe(1);

    const [saveCall] = await heynotePage.page.evaluate(() => window.__saveImageCalls);
    expect(saveCall.mime).toBe("image/png");
    expect(saveCall.size).toBeGreaterThan(0);

    const updatedContent = await heynotePage.getContent();
    const images = parseImagesFromString(updatedContent);
    const image = images.find((entry) => entry.id === "img-draw-1");
    expect(image?.file).toBe("heynote-file://image/drawn-test.png");
});

import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";
import { parseImagesFromString } from "../../src/editor/image/image-parsing.js";

let heynotePage;

const buildContent = (tag) => `
∞∞∞text
hello ${tag} world`;

async function openDrawModal(page) {
    const imageWidget = page.locator(".heynote-image");
    await expect(imageWidget).toBeVisible();
    await imageWidget.hover();

    const drawButton = page.locator(".heynote-image .buttons-container .draw");
    if (await drawButton.isVisible()) {
        await drawButton.click();
        return;
    }
}

test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Hovering in headless Webkit is flaky")

    await page.addInitScript(() => {
        // Playwright can't intercept custom schemes like heynote-file:// with page.route,
        // because Chromium never issues a network request. Rewrite image src instead.
        const original = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
        if (!original || typeof original.set !== "function" || typeof original.get !== "function") {
            return;
        }
        Object.defineProperty(HTMLImageElement.prototype, "src", {
            configurable: true,
            enumerable: original.enumerable,
            get() {
                return original.get.call(this);
            },
            set(value) {
                // Swap heynote-file://image/... for the mocked saveImage data URL so the
                // widget can render in browser tests.
                if (typeof value === "string" && value.startsWith("heynote-file://image/")) {
                    const replacement = window.__mockSavedImageDataUrl || "/icon.png";
                    return original.set.call(this, replacement);
                }
                return original.set.call(this, value);
            },
        });
    });
    heynotePage = new HeynotePage(page);
    await heynotePage.goto();
    await heynotePage.page.evaluate(async () => {
        const img = new Image();
        img.src = "/icon.png";
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        window.__baseImageDataUrl = canvas.toDataURL("image/png");
        const base64 = window.__baseImageDataUrl.split(",")[1] || "";
        window.__baseImageSize = atob(base64).length;
    });
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
            if (payload?.data && payload?.mime) {
                const bytes = payload.data instanceof Uint8Array ? payload.data : new Uint8Array(payload.data);
                let binary = "";
                for (const byte of bytes) {
                    binary += String.fromCharCode(byte);
                }
                window.__mockSavedImageDataUrl = `data:${payload.mime};base64,${btoa(binary)}`;
                window.__mockSavedImageSize = bytes.length;
            }
            return "drawn-test.png";
        };
    });

    const tag = "<∞img;id=img-draw-1;file=/icon.png;w=120;h=120∞>";
    await heynotePage.setContent(buildContent(tag));

    await openDrawModal(heynotePage.page);

    const modal = heynotePage.page.locator(".draw-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("canvas").first()).toBeVisible();

    const drawCanvas = modal.locator("canvas.upper-canvas");
    const box = await drawCanvas.boundingBox();
    expect(box).not.toBeNull();
    const startX = box.x + box.width * 0.3;
    const startY = box.y + box.height * 0.3;
    const endX = box.x + box.width * 0.6;
    const endY = box.y + box.height * 0.6;

    await heynotePage.page.mouse.move(startX, startY);
    await heynotePage.page.mouse.down();
    await heynotePage.page.mouse.move(endX, endY);
    await heynotePage.page.mouse.up();

    await modal.locator(".bottom-bar .save").click();
    await expect(modal).toHaveCount(0);

    await expect.poll(async () => {
        return await heynotePage.page.evaluate(() => window.__saveImageCalls.length);
    }).toBe(1);

    const [saveCall] = await heynotePage.page.evaluate(() => window.__saveImageCalls);
    expect(saveCall.mime).toBe("image/png");
    expect(saveCall.size).toBeGreaterThan(0);

    const sizeChanged = await heynotePage.page.evaluate(() => {
        return window.__mockSavedImageSize !== window.__baseImageSize;
    });
    expect(sizeChanged).toBe(true);

    const updatedContent = await heynotePage.getContent();
    const images = parseImagesFromString(updatedContent);
    const image = images.find((entry) => entry.id === "img-draw-1");
    expect(image?.file).toBe("heynote-file://image/drawn-test.png");
});

test("draw modal saves without drawing keeps image unchanged", async () => {
    await heynotePage.page.evaluate(() => {
        window.__saveImageCalls = [];
        window.heynote.buffer.saveImage = async (payload) => {
            if (payload?.data && payload?.mime) {
                const bytes = payload.data instanceof Uint8Array ? payload.data : new Uint8Array(payload.data);
                let binary = "";
                for (const byte of bytes) {
                    binary += String.fromCharCode(byte);
                }
                window.__mockSavedImageDataUrl = `data:${payload.mime};base64,${btoa(binary)}`;
                window.__mockSavedImageSize = bytes.length;
            }
            return "drawn-test.png";
        };
    });

    const tag = "<∞img;id=img-draw-2;file=/icon.png;w=120;h=120∞>";
    await heynotePage.setContent(buildContent(tag));

    await openDrawModal(heynotePage.page);

    const modal = heynotePage.page.locator(".draw-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("canvas").first()).toBeVisible();

    await modal.locator(".bottom-bar .save").click();
    await expect(modal).toHaveCount(0);

    await expect.poll(async () => {
        return await heynotePage.page.evaluate(() => window.__mockSavedImageSize || 0);
    }).toBeGreaterThan(0);

    const isUnchanged = await heynotePage.page.evaluate(() => {
        return window.__mockSavedImageDataUrl === window.__baseImageDataUrl
            && window.__mockSavedImageSize === window.__baseImageSize;
    });
    expect(isUnchanged).toBe(true);
});

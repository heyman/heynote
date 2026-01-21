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

test("renders image widgets and toggles selection styling", async () => {
    const tag = "<∞img;id=img-1;file=heynote-file://image/test.png;w=200;h=100∞>";
    const content = buildContent(tag);

    await heynotePage.setContent(content);

    const imageWidget = heynotePage.page.locator(".heynote-image");
    await expect(imageWidget).toHaveCount(1);

    const tagStart = content.indexOf(tag);
    await heynotePage.setCursorPosition(tagStart);
    await expect(heynotePage.page.locator(".heynote-image.selected")).toHaveCount(1);

    await heynotePage.setCursorPosition(0);
    await expect(heynotePage.page.locator(".heynote-image.selected")).toHaveCount(0);
});

test("resizing an image widget updates its tag", async () => {
    const tag = "<∞img;id=img-2;file=heynote-file://image/test.png;w=200;h=100∞>";
    await heynotePage.setContent(buildContent(tag));

    const resizeHandle = heynotePage.page.locator(".heynote-image .resize-handle");
    await expect(resizeHandle).toBeVisible();

    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await heynotePage.page.mouse.move(startX, startY);
    await heynotePage.page.mouse.down();
    await heynotePage.page.mouse.move(startX + 60, startY + 40);
    await heynotePage.page.mouse.up();

    await expect.poll(async () => {
        const content = await heynotePage.getContent();
        return /dw=\d/.test(content) && /dh=\d/.test(content);
    }).toBeTruthy();

    const updatedContent = await heynotePage.getContent();
    const match = updatedContent.match(/dw=(\d+(?:\.\d+)?);dh=(\d+(?:\.\d+)?)/);
    expect(match).not.toBeNull();
    expect(Number(match[1])).toBeGreaterThan(0);
    expect(Number(match[2])).toBeGreaterThan(0);
});

test("delete middle image then resize last image on the same row", async () => {
    const tag1 = "<∞img;id=img-1;file=heynote-file://image/test.png;w=200;h=100∞>";
    const tag2 = "<∞img;id=img-2;file=heynote-file://image/test.png;w=200;h=100∞>";
    const tag3 = "<∞img;id=img-3;file=heynote-file://image/test.png;w=200;h=100∞>";
    const content = buildContent(`${tag1}${tag2}${tag3}`);

    await heynotePage.setContent(content);

    const middleTagEnd = content.indexOf(tag2) + tag2.length;
    await heynotePage.setCursorPosition(middleTagEnd);
    await heynotePage.page.locator("body").press("Backspace");

    await expect.poll(async () => {
        const updated = await heynotePage.getContent();
        return parseImagesFromString(updated).some((image) => image.id === "img-2");
    }).toBeFalsy();
    await expect(heynotePage.page.locator(".heynote-image")).toHaveCount(2);

    const lastImageHandle = heynotePage.page
        .locator(".heynote-image")
        .nth(1)
        .locator(".resize-handle");
    await expect(lastImageHandle).toBeVisible();

    const handleBox = await lastImageHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await heynotePage.page.mouse.move(startX, startY);
    await heynotePage.page.mouse.down();
    await heynotePage.page.mouse.move(startX + 70, startY + 40);
    await heynotePage.page.mouse.up();

    await expect.poll(async () => {
        const updated = await heynotePage.getContent();
        const images = parseImagesFromString(updated);
        const lastImage = images.find((image) => image.id === "img-3");
        return Boolean(lastImage?.displayWidth && lastImage?.displayHeight);
    }).toBeTruthy();
});

test("copy shortcut copies image data when cursor is after image", async () => {
    const tag = "<∞img;id=img-copy;file=https://example.com/test.png;w=200;h=200∞>";
    const content = buildContent(tag);

    await heynotePage.setContent(content);

    await heynotePage.page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1e90ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            window.__testImageBlob = blob;
        }, "image/png");

        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input, init) => {
            if (window.__testImageBlob) {
                return new Response(window.__testImageBlob, {
                    status: 200,
                    headers: { "Content-Type": "image/png" },
                });
            }
            return originalFetch(input, init);
        };

        window.__clipboardWriteTypes = [];
        navigator.clipboard.write = async (items) => {
            window.__clipboardWriteTypes = items.flatMap((item) => item.types);
        };
    });

    await expect(heynotePage.page.locator(".heynote-image")).toHaveCount(1);
    await heynotePage.page.locator(".cm-editor").click();

    const tagEnd = content.indexOf(tag) + tag.length;
    await heynotePage.setCursorPosition(tagEnd);
    await heynotePage.page.locator("body").press(heynotePage.agnosticKey("Mod+C"));

    await expect.poll(async () => {
        return await heynotePage.page.evaluate(() => window.__clipboardWriteTypes);
    }).toContain("image/png");
});

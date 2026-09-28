import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";
import { parseDocumentsFromString } from "../../src/editor/document/document-parsing.js";

let heynotePage;

const buildContent = (tag) => `
∞∞∞text
hello ${tag} world`;

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page);
    await heynotePage.goto();
});

test("renders document widget with name and link, and toggles selection styling", async () => {
    const tag = "<∞doc;id=doc-1;file=heynote-file://document/quarterly-report.pdf;name=Quarterly%20Report.pdf;size=1048576∞>";
    const content = buildContent(tag);

    await heynotePage.setContent(content);

    const docWidget = heynotePage.page.locator(".heynote-document");
    await expect(docWidget).toHaveCount(1);
    await expect(docWidget.locator(".doc-name")).toHaveText("Quarterly Report.pdf");
    await expect(docWidget.locator(".doc-size")).toHaveText("1.0 MB");

    // Link exists
    const docLink = docWidget.locator(".doc-link");
    await expect(docLink).toHaveCount(1);

    // Toggle selection
    const tagStart = content.indexOf(tag);
    await heynotePage.setCursorPosition(tagStart);
    await expect(heynotePage.page.locator(".heynote-document.selected")).toHaveCount(1);

    await heynotePage.setCursorPosition(0);
    await expect(heynotePage.page.locator(".heynote-document.selected")).toHaveCount(0);
});

test("clicking the document link triggers openDocument", async () => {
    const tag = "<∞doc;id=doc-click;file=heynote-file://document/my-spec.docx;name=My%20Spec.docx∞>";
    const content = buildContent(tag);

    await heynotePage.setContent(content);

    // Mock openDocument on window.heynote.buffer
    await heynotePage.page.evaluate(() => {
        window.__openedDocs = [];
        window.heynote.buffer.openDocument = async (path) => {
            window.__openedDocs.push(path);
            return true;
        };
    });

    const docLink = heynotePage.page.locator(".heynote-document .doc-link");
    await expect(docLink).toBeVisible();
    await docLink.click();

    await expect.poll(async () => {
        return await heynotePage.page.evaluate(() => window.__openedDocs);
    }).toEqual(["heynote-file://document/my-spec.docx"]);
});

test("deleting document widget removes its tag", async () => {
    const tag = "<∞doc;id=doc-del;file=heynote-file://document/test.pdf;name=test.pdf∞>";
    const content = buildContent(tag);

    await heynotePage.setContent(content);
    await expect(heynotePage.page.locator(".heynote-document")).toHaveCount(1);

    const tagEnd = content.indexOf(tag) + tag.length;
    await heynotePage.setCursorPosition(tagEnd);
    await heynotePage.page.locator("body").press("Backspace");

    await expect.poll(async () => {
        const updated = await heynotePage.getContent();
        return parseDocumentsFromString(updated).some((doc) => doc.id === "doc-del");
    }).toBeFalsy();
    await expect(heynotePage.page.locator(".heynote-document")).toHaveCount(0);
});

test("drag and drop document creates document tag and widget", async () => {
    await heynotePage.setContent(`
∞∞∞text
drop here: `);

    // Mock saveDocument on window.heynote.buffer
    await heynotePage.page.evaluate(() => {
        window.__savedDocs = [];
        window.heynote.buffer.saveDocument = async ({ name, data }) => {
            window.__savedDocs.push({ name, length: data.length });
            return name;
        };
    });

    // Simulate drop event with a PDF file
    await heynotePage.page.evaluate(async () => {
        const editor = document.querySelector(".cm-content");
        const dt = new DataTransfer();
        const file = new File(["dummy pdf content"], "sample.pdf", { type: "application/pdf" });
        dt.items.add(file);

        const dropEvent = new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
            clientX: 100,
            clientY: 100,
        });
        editor.dispatchEvent(dropEvent);
    });

    await expect.poll(async () => {
        return await heynotePage.page.evaluate(() => window.__savedDocs.length);
    }).toBe(1);

    await expect(heynotePage.page.locator(".heynote-document")).toHaveCount(1);
    await expect(heynotePage.page.locator(".heynote-document .doc-name")).toHaveText("sample.pdf");

    const content = await heynotePage.getContent();
    const docs = parseDocumentsFromString(content);
    expect(docs).toHaveLength(1);
    expect(docs[0].file).toBe("heynote-file://document/sample.pdf");
});

test("drag and drop disallowed file extension does not create document widget", async () => {
    await heynotePage.setContent(`
∞∞∞text
drop here: `);

    await heynotePage.page.evaluate(() => {
        window.__savedDocs = [];
        window.heynote.buffer.saveDocument = async ({ name, data }) => {
            window.__savedDocs.push({ name, length: data.length });
            return name;
        };
    });

    // Simulate drop with an executable file
    await heynotePage.page.evaluate(async () => {
        const editor = document.querySelector(".cm-content");
        const dt = new DataTransfer();
        const file = new File(["malicious payload"], "setup.exe", { type: "application/x-msdownload" });
        dt.items.add(file);

        const dropEvent = new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
            clientX: 100,
            clientY: 100,
        });
        editor.dispatchEvent(dropEvent);
    });

    // Wait a brief moment to ensure no async upload occurs
    await heynotePage.page.waitForTimeout(300);

    const savedCount = await heynotePage.page.evaluate(() => window.__savedDocs.length);
    expect(savedCount).toBe(0);
    await expect(heynotePage.page.locator(".heynote-document")).toHaveCount(0);
});

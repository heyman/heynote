import { test, expect } from '@playwright/test'
import { HeynotePage } from './test-utils.js'
import { COLOR_SCHEMES } from '@/src/theme/schemes/index.js'
import { resolveTheme } from '@/src/theme/resolve.js'

test.use({ viewport: { width: 1100, height: 1500 } })

const sample = `
∞∞∞javascript
// JavaScript comment
const greeting = "hello";
const count = 42;
const enabled = true;
function greet(name) { return greeting; }
greet("Ada");
console.log(greeting);
const service = { speak() { return "hi"; } };
service.speak();
∞∞∞python
# Python comment
def calculate(value):
    return value + 7
answer = calculate(7)
∞∞∞json
{"title": "A note", "total": 12, "ready": false}
∞∞∞html
<section class="note">Hello &amp; goodbye</section>
∞∞∞markdown
# Clear heading
**Bold**, *emphasis*, \`inline\`, and [link](https://example.com).
∞∞∞text
Just a regular note.
`

function rgb(hex) {
    return `rgb(${hex.slice(1).match(/../g).map(channel => parseInt(channel, 16)).join(', ')})`
}

function token(page, text) {
    return page.locator('.cm-content .cm-line span').filter({ hasText: text }).first()
}

for (const mode of ['light', 'dark']) {
    test(`all seven ${mode} syntax palettes render code, data, and Markdown with their semantic colors`, async ({ page }) => {
        const heynote = new HeynotePage(page)
        await heynote.goto()
        await page.evaluate(mode => window.heynote.themeMode.set(mode), mode)

        for (const scheme of COLOR_SCHEMES) {
            await test.step(scheme.label, async () => {
                await heynote.setContent(JSON.stringify({ formatVersion: '2.0.0', name: 'Scratch', color: scheme.id }) + sample)
                const { ui, syntax } = resolveTheme(scheme, mode)
                await expect(page.locator('html')).toHaveAttribute('data-buffer-color', scheme.id)
                await expect(page.locator('.cm-editor')).toHaveCSS('color', rgb(ui.editorText))
                const cases = [
                    [/^const$/, 'keyword'],
                    [/^"hello"$/, 'string'],
                    [/^42$/, 'number'],
                    [/^true$/, 'bool'],
                    [/^\/\/ JavaScript comment$/, 'comment'],
                    [/^greet$/, 'functionDefinition'],
                    [/^log$/, 'function'],
                    // The JavaScript grammar tags object-method declarations as properties.
                    [/^speak$/, 'definitionProperty'],
                    [/^def$/, 'keyword'],
                    [/^# Python comment$/, 'comment'],
                    [/^calculate$/, 'functionDefinition'],
                    [/^"title"$/, 'property'],
                    [/^"A note"$/, 'string'],
                    [/^false$/, 'bool'],
                    [/^section$/, 'tag'],
                    [/^class$/, 'attribute'],
                    [/^"note"$/, 'string'],
                    [/^\s*Clear heading$/, 'heading1'],
                    [/^inline$/, 'monospace'],
                ]
                for (const [text, role] of cases) {
                    const color = syntax[role] === 'inherit' ? ui.editorText : syntax[role]
                    await expect(token(page, text), `${scheme.id} ${mode} ${role}: ${text}`).toHaveCSS('color', rgb(color))
                }
                await expect(page.locator('.cm-line span').filter({ hasText: /^speak$/ }).nth(1)).toHaveCSS('color', rgb(syntax.function))
                await expect(token(page, /^\s*Clear heading$/)).toHaveCSS('font-weight', '700')
                await expect(token(page, /^Bold$/)).toHaveCSS('font-weight', '700')
                await expect(token(page, /^emphasis$/)).toHaveCSS('font-style', 'italic')
            })
        }
        expect(heynote.getErrors()).toEqual([])
    })
}

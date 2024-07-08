import * as fs from 'node:fs'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import license from 'rollup-plugin-license'
import pkg from './package.json'
import path from 'path'

import { keyHelpStr } from "./shared-utils/key-helper";
import { LANGUAGES }  from "./src/editor/languages"

rmSync('dist-electron', { recursive: true, force: true })

const isDevelopment = process.env.NODE_ENV === "development" || !!process.env.VSCODE_DEBUG
const isProduction = process.env.NODE_ENV === "production"

const injectKeybindsInDocs = async () => {
	const keybindsRegex = /^(<!-- keyboard_shortcuts -->\s*).*?^(```\s+#)/gms
	const shortcuts = `$1**On Mac**

\`\`\`
${keyHelpStr('darwin')}
\`\`\`

**On Windows and Linux**

\`\`\`
${keyHelpStr('win32')}
$2`
	const docsPath = path.resolve(__dirname, 'docs', 'index.md')
	let docs = fs.readFileSync(docsPath, 'utf-8')
	docs = docs.replace(keybindsRegex, shortcuts)
	fs.writeFileSync(docsPath, docs)
}

const updateGuesslangLanguagesInWebWorker = async () => {
	const langDetectWorkerPath = path.resolve(__dirname, 'public', 'langdetect-worker.js')
	let workerFileContents = fs.readFileSync(langDetectWorkerPath, 'utf-8')
	const langListRegex = /^GUESSLANG_LANGUAGES = \[[^\]]+\]/gms
	const newLangList = JSON.stringify(LANGUAGES.map(l => l.guesslang).filter(l => l !== null))
	workerFileContents = workerFileContents.replace(langListRegex, `GUESSLANG_LANGUAGES = ${newLangList}`)
	fs.writeFileSync(langDetectWorkerPath, workerFileContents)
}


// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
        alias: {
            '@': path.resolve(__dirname),
        },
    },

	plugins: [
		vue(),
		injectKeybindsInDocs(),
		updateGuesslangLanguagesInWebWorker(),
		electron([
			{
				// Main-Process entry file of the Electron App.
				entry: 'electron/main/index.ts',
				onstart(options) {
					if (process.env.VSCODE_DEBUG) {
						console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
					} else {
						options.startup()
					}
				},
				vite: {
					build: {
						sourcemap: isDevelopment,
						minify: isProduction,
						outDir: 'dist-electron/main',
						rollupOptions: {
							external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
						},
					},
				},
			},
			{
				entry: 'electron/preload/index.ts',
				onstart(options) {
					// Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
					// instead of restarting the entire Electron App.
					options.reload()
				},
				vite: {
					build: {
						sourcemap: isDevelopment,
						minify: isProduction,
						outDir: 'dist-electron/preload',
						rollupOptions: {
							external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
						},
					},
				},
			},
			{
				entry: 'electron/preload/about-preload.js',
				onstart(options) {
					// Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
					// instead of restarting the entire Electron App.
					options.reload()
				},
				vite: {
					build: {
						sourcemap: isDevelopment,
						minify: isProduction,
						outDir: 'dist-electron/preload',
						rollupOptions: {
							external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
						},
					},
				},
			}
		]),
		// Use Node.js API in the Renderer-process
		renderer({
			nodeIntegration: false, // turning this on will break Math.js
		}),

		// Add license header to the built files
		license({thirdParty: {
			output: join(__dirname, 'dist', 'dependencies.txt'),
			includePrivate: true, // Default is false.
		  },
		})
	],
	css: {
		preprocessorOptions: {
			sass: {
				additionalData: `
    @import "./src/css/include.sass"
`
			}
		}
	},
	server: !!process.env.VSCODE_DEBUG ? (() => {
		const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
		return {
			host: url.hostname,
			port: +url.port,
		}
	})() : undefined,
	clearScreen: false,
})

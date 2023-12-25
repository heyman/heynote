import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import { directoryPlugin } from "vite-plugin-list-directory-contents";


const middleware = () => {
    return {
        name: 'middleware',
        apply: 'serve',
        configureServer(viteDevServer) {
            return () => {
                viteDevServer.middlewares.use(async (req, res, next) => {
                    console.log("url:", req.originalUrl)
                    if (!req.originalUrl.endsWith(".html") && req.originalUrl !== "/") {
                        req.url = `/src` + req.originalUrl + ".html";
                    } else if (req.url === "/index.html") {
                        //req.url = `/src` + req.url;
                    }

                    next();
                });
            };
        }
    }
}


// https://vitejs.dev/config/
export default defineConfig({
    publicDir: "../public",

    plugins: [
        vue(), 
        //directoryPlugin({ baseDir: __dirname }),
    ],

    css: {
        preprocessorOptions: {
            sass: {
                additionalData: `
    @import "../src/css/include.sass"
    `
            },
        },
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, '..'),
        },
    },
})

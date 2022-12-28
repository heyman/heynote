//import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from "@rollup/plugin-node-resolve"
//import { lezer } from "@lezer/generator/rollup"


export default {
  input: "./src/editor.js",
  output: {
    file: "./src/editor.bundle.js",
    format: "iife",
    //globals: {
    //  //
    //},
  },
  plugins: [
    // typescript({
    //   check: false,
    //   tsconfigOverride: {
    //     compilerOptions: {
    //       lib: ['es5', 'es6'],
    //       sourceMap: true,
    //       target: 'es6',
    //       strict: false
    //     }
    //   }
    // }),
    nodeResolve(),
    //lezer(),
  ]
}

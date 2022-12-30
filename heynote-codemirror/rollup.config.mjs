//import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from "@rollup/plugin-node-resolve"
//import { lezer } from "@lezer/generator/rollup"


export default {
  input: "./src/index.js",
  output: {
    file: "./src/bundle.js",
    format: "iife",
    //sourceMap: "inline",
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

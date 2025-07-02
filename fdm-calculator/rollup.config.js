import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"

export default defineConfig({
    input: "src/index.ts", // Your entry point
    output: [
        {
            file: "dist/fdm-calculator.esm.js", // Output for ES modules
            format: "esm",
            sourcemap: process.env.NODE_ENV === "development",
        },
    ],
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            sourceMap: process.env.NODE_ENV === "development",
            inlineSources: process.env.NODE_ENV === "development",
        }),
        json(),
        terser({
            sourceMap:
                process.env.NODE_ENV === "development"
                    ? {
                          filename: "dist/fdm-calculator.esm.js.map",
                          url: "fdm-calculator.esm.js.map",
                      }
                    : false,
        }), // Minifies the output
    ],
    external: ["@svenvw/fdm-core", "geotiff"],
})

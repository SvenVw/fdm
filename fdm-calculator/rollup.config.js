import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"
import packageJson from "./package.json" with { type: "json" }

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
        terser({
            sourceMap:
                process.env.NODE_ENV === "development"
                    ? {
                          filename: "dist/fdm-calculator.esm.js.map",
                          url: "fdm-calculator.esm.js.map",
                      }
                    : false,
        }), // Minifies the output
        {
            renderChunk: (code) => {
                return {
                    code: code.replace(
                        "fdm-calculator:{FDM_CALCULATOR_VERSION}",
                        `fdm-calculator:${packageJson.version}`,
                    ),
                }
            },
        }, // Modifies bundled package.ts to contain the actual package version
    ],
    external: ["@svenvw/fdm-core", "geotiff"],
})

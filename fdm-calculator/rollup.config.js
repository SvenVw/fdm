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
            renderChunk: (code, map) => {
                const replacement = `"fdm-calculator:${packageJson.version}"`

                const placeholder = `"fdm-calculator:{FDM_CALCULATOR_VERSION}"`
                const occurrences =
                    code.match(
                        new RegExp(
                            placeholder.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&"),
                            "g",
                        ),
                    ) || []

                if (occurrences.length === 0) {
                    console.warn(
                        `⚠️ Version placeholder "${placeholder}" not found in bundle`,
                    )
                } else if (occurrences.length > 1) {
                    console.warn(
                        `⚠️ Version placeholder "${placeholder}" appears ${occurrences.length} times`,
                    )
                }

                if (replacement.length > placeholder.length) {
                    console.warn(
                        "⚠️ Replacement fdm-calculator version string ended up longer than the placeholder in package.ts. Source map will be broken.",
                    )
                }

                return {
                    code: code.replace(
                        placeholder,
                        replacement.padEnd(placeholder.length, " "), // Pad to not break the source map
                    ),
                    map,
                }
            },
        }, // Modifies bundled package.ts to contain the actual package version
    ],
    external: ["@svenvw/fdm-core", "geotiff"],
})

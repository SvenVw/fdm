import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"
import packageJson from "./package.json" with { type: "json" }

const isProd = process.env.NODE_ENV === "production"

export default defineConfig({
    input: "src/index.ts",
    output: [
        {
            file: "dist/fdm-calculator.esm.js",
            format: "esm",
            sourcemap: isProd ? true : "inline",
        },
    ],
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            sourceMap: !isProd, // handled by rollup in prod, inline in dev
            inlineSources: !isProd,
        }),
        isProd &&
            terser({
                sourceMap: true,
            }),
        {
            renderChunk: (code, map) => {
                const replacement = `"fdm-calculator:${packageJson.version}"`
                const placeholder = `"fdm-calculator:{FDM_CALCULATOR_VERSION}"`
                
                if (!code.includes(placeholder)) {
                    console.warn(`⚠️ Version placeholder "${placeholder}" not found in bundle`)
                    return null
                }

                if (replacement.length > placeholder.length) {
                    console.warn(
                        "⚠️ Replacement fdm-calculator version string ended up longer than the placeholder. Source map will be broken.",
                    )
                }

                return {
                    code: code.replace(
                        placeholder,
                        replacement.padEnd(placeholder.length, " "),
                    ),
                    map,
                }
            },
        },
    ],
    external: [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
    ],
})

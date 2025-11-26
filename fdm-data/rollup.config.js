import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
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
            file: "dist/fdm-data.esm.js",
            format: "esm",
            sourcemap: isProd ? true : "inline",
        },
    ],

    plugins: [
        resolve(),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            sourceMap: !isProd,
            inlineSources: !isProd,
        }),
        json(),
        isProd &&
            terser({
                sourceMap: true,
            }),
    ],
    external: [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
    ],
})

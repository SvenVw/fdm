// rollup.config.js
import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"

export default defineConfig({
    input: "src/index.ts", // Your entry point
    output: [
        {
            file: "dist/fdm-calculator.esm.js", // Output for ES modules
            format: "esm",
        },
    ],

    plugins: [resolve(), typescript()],
})

import json from "@rollup/plugin-json"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"

export default defineConfig({
    input: "src/index.ts", // Your entry point
    output: [
        {
            file: "dist/fdm-data.esm.js", // Output for ES modules
            format: "esm",
        },
    ],

    plugins: [
        resolve(),
        typescript({
            tsconfig: "./tsconfig.json",
        }),
        json(),
        terser({
            sourceMap:
                process.env.NODE_ENV === "production"
                    ? {
                          fileName: "dist/fdm-data.esm.js.map",
                          url: "fdm-data.esm.js.map",
                      }
                    : false,
        }), // Minifies the output
    ],
})

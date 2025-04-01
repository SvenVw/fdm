// rollup.config.js
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
        },
    ],
    plugins: [
        resolve(),
        typescript(),
        terser({
            sourceMap:
                process.env.NODE_ENV === "production"
                    ? {
                          fileName: "dist/fdm-calculator.esm.js.map",
                          url: "fdm-calculator.esm.js.map",
                      }
                    : false,
        }), // Minifies the output
    ],
    external: ["@svenvw/fdm-core"],
})

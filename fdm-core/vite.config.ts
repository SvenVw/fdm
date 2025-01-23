// vite.config.ts

/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

import { resolve } from "node:path"
import { copy } from "fs-extra"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import nodePolyfills from 'rollup-plugin-polyfill-node';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "fdm-core",
            fileName: "fdm-core",
        },
        rollupOptions: {
            external: [
                "perf_hooks",
            ],
            output: {
                globals: {
                    perf_hooks: "perf_hooks",
                },
                inlineDynamicImports: true,
            },
        },
    },
    plugins: [
        dts(),
        nodePolyfills(),
        // Add a custom plugin to copy migration folder
        {
            name: "copy-migrations-folder",
            closeBundle: () => {
                copy("src/db/migrations", "dist/db/migrations")
                    .then(() => {
                        console.log(
                            "Copied migrations folder to dist/db/migrations",
                        )
                    })
                    .catch((err) => {
                        console.error("Error copying migrations folder:", err)
                    })
            },
        },
    ],
    optimizeDeps: {
        exclude: ["@electric-sql/pglite"],
    },
    // test: {
    //   // ...
    // }
})

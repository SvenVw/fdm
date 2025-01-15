// vite.config.ts

/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
    logLevel: "error",
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "fdm-data",
            fileName: "fdm-data",
        },
        rollupOptions: {
            external: [
                "node:util",
                "node:buffer",
                "node:stream",
                "node:net",
                "node:url",
                "node:fs",
                "node:path",
                "perf_hooks",
            ],
            output: {
                globals: {
                    "node:stream": "stream",
                    "node:buffer": "buffer",
                    "node:util": "util",
                    "node:net": "net",
                    "node:url": "url",
                    "node:fs": "fs",
                    "node:path": "path",
                    perf_hooks: "perf_hooks",
                },
                inlineDynamicImports: true,
            },
        },
    },
    plugins: [dts()],
    test: {
        // ...
    },
})

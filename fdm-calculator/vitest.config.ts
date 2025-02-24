import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globalSetup: "./src/setup-test.ts",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "**/node_modules/**",
                "**/dist/**",
                "**/turbo**",
                "**/setup-test.ts",
                "**.d.ts",
                "*.config.ts",
                "*.config.js",
            ],
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        alias: {
            "@": "./src",
        },
        environment: "node",
    },
})

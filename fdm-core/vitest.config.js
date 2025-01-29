// vitest.config.ts
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globalSetup: "./src/global-setup.ts",
    },
})

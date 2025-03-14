import { reactRouter } from "@react-router/dev/vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [
        reactRouter(),
        tsconfigPaths(),
        sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            project: process.env.SENTRY_PROJECT,
        }),
    ],
    define: {
        global: {},
    },
    build: {
        sourcemap: process.env.NODE_ENV === "development",
        target: "ES2022",
    },
})

import { reactRouter } from "@react-router/dev/vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [
        reactRouter(),
        tsconfigPaths(),
        sentryVitePlugin({
            org: process.env.VITE_SENTRY_ORG,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            project: process.env.VITE_SENTRY_PROJECT,
            telemetry: false,
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

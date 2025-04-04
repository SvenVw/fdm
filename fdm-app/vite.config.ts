import { reactRouter } from "@react-router/dev/vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

// Vite does not support loading config files from `/lib/config`...
const org = process.env.VITE_SENTRY_ORG
const authToken = process.env.SENTRY_AUTH_TOKEN
const project = process.env.VITE_SENTRY_PROJECT
let pluginSentry: ReturnType<typeof sentryVitePlugin> | undefined
if (org && authToken && project) {
    pluginSentry = sentryVitePlugin({
        org: org,
        authToken: authToken,
        project: project,
        telemetry: false,
    })
}

export default defineConfig({
    plugins: [reactRouter(), tsconfigPaths(), pluginSentry],
    define: {
        global: {},
    },
    build: {
        sourcemap: process.env.NODE_ENV === "development",
        target: "ES2022",
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return "package"
                    }
                    if (id.includes("app/components/ui")) {
                        return "components/ui"
                    }
                    if (id.includes("app/components/custom")) {
                        return "components/custom"
                    }
                    if (id.includes("app/lib")) {
                        return "lib"
                    }
                    if (id.includes("app/store")) {
                        return "store"
                    }
                    if (id.includes("app/hooks")) {
                        return "hooks"
                    }
                    if (id.includes("public")) {
                        return "public"
                    }
                },
            },
        },
    },
})

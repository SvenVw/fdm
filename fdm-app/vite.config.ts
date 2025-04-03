import { reactRouter } from "@react-router/dev/vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import fdmConfig from "./fdm.config"

let pluginSentry: any
if (fdmConfig.analytics.sentry) {
    pluginSentry = sentryVitePlugin({
        org: fdmConfig.analytics.sentry.organization,
        authToken: fdmConfig.analytics.sentry.auth_token,
        project: fdmConfig.analytics.sentry.project,
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

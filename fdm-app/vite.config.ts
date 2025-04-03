import { reactRouter } from "@react-router/dev/vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { serverConfig } from "~/lib/config"

let pluginSentry: any
if (serverConfig.analytics.sentry) {
    pluginSentry = sentryVitePlugin({
        org: serverConfig.analytics.sentry.organization,
        authToken: serverConfig.analytics.sentry.auth_token,
        project: serverConfig.analytics.sentry.project,
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

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
        sourcemap: true,
        target: "ES2022",
    },
})

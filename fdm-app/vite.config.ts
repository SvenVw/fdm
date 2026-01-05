import { reactRouter } from "@react-router/dev/vite"
import { sentryReactRouter } from "@sentry/react-router"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig((env) => {
    const isProd = env.mode === "production"
    const enableSentry = isProd && !!process.env.SENTRY_AUTH_TOKEN

    return {
        plugins: [
            reactRouter(),
            tsconfigPaths(),
            tailwindcss(),
            enableSentry &&
                sentryReactRouter(
                    {
                        org: process.env.PUBLIC_SENTRY_ORG,
                        project: process.env.PUBLIC_SENTRY_PROJECT,
                        authToken: process.env.SENTRY_AUTH_TOKEN,
                        release: {
                            name: process.env.npm_package_version,
                            setCommits: {
                                auto: true,
                            },
                        },
                    },
                    env,
                ),
        ].filter(Boolean),
        envPrefix: "PUBLIC_",
        ssr: {
            noExternal: [
                "posthog-js",
                "posthog-js/react",
                "@geomatico/maplibre-cog-protocol",
            ],
        },
        build: {
            sourcemap: true,
            target: "ES2022",
        },
        optimizeDeps: {
            exclude: [
                "@svenvw/fdm-core",
                "@svenvw/fdm-data",
                "@svenvw/fdm-calculator",
            ],
        },
    }
})

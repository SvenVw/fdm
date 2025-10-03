import fs from "node:fs/promises"

import { reactRouter } from "@react-router/dev/vite"
import {
    type SentryReactRouterBuildOptions,
    sentryReactRouter,
} from "@sentry/react-router"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(async (config) => {
    // We need to go one directory up since package.json is not inside the dist folder
    const fdmCalculatorPackageJsonPath = new URL(
        "../package.json",
        import.meta.resolve("@svenvw/fdm-calculator"),
    )
    const fdmCalculatorPackage = JSON.parse(
        await fs.readFile(fdmCalculatorPackageJsonPath, { encoding: "utf-8" }),
    )

    return {
        plugins: [
            reactRouter(),
            tsconfigPaths(),
            tailwindcss(),
            // Conditionally add Sentry plugin only for production builds
            ...(process.env.SENTRY_AUTH_TOKEN !== undefined &&
            process.env.NODE_ENV === "production"
                ? [
                      sentryReactRouter(
                          {
                              org: process.env.PUBLIC_SENTRY_ORG,
                              project: process.env.PUBLIC_SENTRY_PROJECT,
                              authToken: process.env.SENTRY_AUTH_TOKEN,
                              release: {
                                  name: process.env.npm_package_version,
                                  setCommits: true,
                              },
                          } as SentryReactRouterBuildOptions,
                          config,
                      ),
                  ]
                : []),
        ],
        envPrefix: "PUBLIC_",
        define: {
            global: {},
            PUBLIC_FDM_CALCULATOR_VERSION: JSON.stringify(
                fdmCalculatorPackage.version || "0.7.0",
            ),
        },
        ssr: {
            noExternal: ["posthog-js", "posthog-js/react"],
        },
        build: {
            sourcemap: true,
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
                        if (id.includes("app/components/blocks")) {
                            return "components/blocks"
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
    }
})

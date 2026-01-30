import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { reactRouter } from "@react-router/dev/vite"
import { sentryReactRouter } from "@sentry/react-router"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const calculatorPackagePath = path.resolve(
    __dirname,
    "../fdm-calculator/package.json",
)
const calculatorPackage = JSON.parse(
    fs.readFileSync(calculatorPackagePath, "utf-8"),
)

const replaceCalculatorVersion = {
    name: "replace-calculator-version",
    transform(code: string, id: string) {
        if (
            id.endsWith("fdm-calculator/src/package.ts") ||
            id.endsWith("fdm-calculator\\src\\package.ts")
        ) {
            const placeholder = "fdm-calculator:{FDM_CALCULATOR_VERSION}"
            if (code.includes(placeholder)) {
                const replacement = `fdm-calculator:${calculatorPackage.version}`
                return {
                    code: code.replace(
                        placeholder,
                        replacement.padEnd(placeholder.length, " "),
                    ),
                    map: null,
                }
            }
        }
    },
}

export default defineConfig((env) => {
    const isProd = env.mode === "production"
    const enableSentry = isProd && !!process.env.SENTRY_AUTH_TOKEN

    return {
        plugins: [
            replaceCalculatorVersion,
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

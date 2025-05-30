import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [reactRouter(), tsconfigPaths()],
    envPrefix: "PUBLIC_",
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

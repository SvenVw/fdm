import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [reactRouter(), tsconfigPaths()],
    define: {
        global: {},
    },
    build: {
        sourcemap: process.env.NODE_ENV === "production" ? false : "inline", // Only generate sourcemaps in development
    },
})

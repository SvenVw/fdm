import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { copy } from "fs-extra"
import packageJson from "./package.json" with { type: "json" }

const isProd = process.env.NODE_ENV === "production"

export default {
    input: "src/index.ts",
    output: {
        file: "dist/fdm-core.esm.js",
        format: "esm",
        inlineDynamicImports: true,
        sourcemap: isProd ? true : "inline",
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            sourceMap: !isProd,
            inlineSources: !isProd,
        }),
        isProd &&
            terser({
                sourceMap: true,
            }),
        {
            name: "copy-migrations-folder",
            closeBundle: () => {
                return copy("src/db/migrations", "dist/db/migrations")
                    .then(() =>
                        console.log(
                            "Copied migrations folder to dist/db/migrations",
                        ),
                    )
                    .catch((err) =>
                        console.error("Error copying migrations folder:", err),
                    )
            },
        },
    ],
    external: [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
        // Retain built-ins that were explicitly listed if they are not in dependencies
        "fs",
        "os",
        "net",
        "tls",
        "crypto",
        "stream",
    ],
}

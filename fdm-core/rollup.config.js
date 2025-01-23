import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import { copy } from "fs-extra" // For copying migrations

export default {
    input: "src/index.ts",
    output: {
        file: "dist/fdm-core.esm.js",
        format: "esm",
        inlineDynamicImports: true,
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs(), // Handles CommonJS modules
        typescript(), // Compiles TypeScript
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
    external: ["fs", "os", "net", "tls", "crypto", "stream", "postgres"],
}

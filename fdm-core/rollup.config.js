import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import { copy } from "fs-extra"

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
        typescript({
            tsconfig: "./tsconfig.json",
        }), // Compiles TypeScript
        terser({
            sourceMap:
                process.env.NODE_ENV === "production"
                    ? {
                          fileName: "dist/fdm-core.esm.js.map",
                          url: "fdm-core.esm.js.map",
                      }
                    : false,
        }), // Minifies the output
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
        "fs",
        "os",
        "net",
        "tls",
        "crypto",
        "stream",
        "postgres",
        "better-auth",
        "drizzle-orm",
    ],
}

// vite.config.ts

/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

import { resolve } from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@nmi/fdm',
      fileName: 'fdm',
    },
    rollupOptions: {
      external: [
        "perf_hooks",
      ],
      output: {
        globals: {
          perf_hooks: "perf_hooks",
        },
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [dts(), nodePolyfills(),],
  test: {
    // ...
  },
});
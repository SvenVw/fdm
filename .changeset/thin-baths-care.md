---
"@svenvw/fdm-app": patch
---

Optimize Vite build configuration:

- Removed inefficient manual chunk splitting.
- Simplified Sentry plugin activation logic.
- Removed unnecessary `global` polyfill.
- Fixed `sentryReactRouter` argument passing.

Optimize the Vite build configuration for `fdm-app` by:

- Removing "vibe-based" manual chunk splitting, allowing Vite/Rollup to handle chunking more effectively.
- Simplifying the conditional Sentry plugin logic for better readability and maintainability.
- Removing the unnecessary `global: {}` polyfill, which is often a workaround for legacy libraries and can hide issues.
- Correcting the `sentryReactRouter` argument passing to resolve a TypeScript error.

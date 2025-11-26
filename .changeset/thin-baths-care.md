---
"@svenvw/fdm-app": patch
---

Optimize Vite build configuration:

- Removed inefficient manual chunk splitting.
- Simplified Sentry plugin activation logic.
- Removed unnecessary `global` polyfill.
- Fixed `sentryReactRouter` argument passing.

---
"@svenvw/fdm-calculator": patch
"@svenvw/fdm-core": patch
"@svenvw/fdm-data": patch
---

Optimize build configuration:

- Fix issue where dependencies could be accidentally bundled into the output.
- Improve development build performance by skipping minification.
- Standardize source map generation.

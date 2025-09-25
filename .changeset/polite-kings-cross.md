---
"@svenvw/fdm-core": minor
---

`createFdmAuth` now supports passing an object of `sendMagicLinkEmail` and `expiresIn` in the magicLink field instead of just the `sendMagicLinkEmail` function, so users can customize how long the magic link emails take to expire.

---
"@svenvw/fdm-core": patch
---

Fix `getFields` filtering: include fields acquired before the timeframe start if they overlap the timeframe (end is within the timeframe or undefined).

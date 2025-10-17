---
"@svenvw/fdm-calculator": minor
---

The nitrogen balance calculation now gracefully handles errors for individual fields. Instead of failing the entire farm calculation, it will now return partial results for successfully calculated fields and provide specific error messages for fields that encountered issues.

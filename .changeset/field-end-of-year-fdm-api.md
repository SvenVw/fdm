---
"@nmi-agro/fdm-api": patch
---

Document that `b_end` and `m_end` are the last day a field is managed or a measure is applied (inclusive, Europe/Amsterdam), and that an end date on 1 January is returned as 31 December of the previous year.

Dates in API responses are now serialised as their calendar date in Europe/Amsterdam instead of UTC, so a date stored at midnight in Europe/Amsterdam is no longer returned as the previous day. Updating a field without `b_end` now leaves its stored end date untouched.
